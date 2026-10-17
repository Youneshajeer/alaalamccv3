import 'server-only';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/supabase-server';

export interface ActivityLogParams {
  userId: string | null;
  userEmail: string;
  actionType: string;
  targetTable: string;
  targetId?: string | null;
  description: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

const activeLogsCache = new Map<string, number>();

const DUPLICATE_WINDOW_MS = 10000;

export async function logActivity(
  params: ActivityLogParams
): Promise<{
  success: boolean;
  duplicateIgnored?: boolean;
  error?: string;
}> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('\n========================================');
  console.log(`[${requestId}] logActivity START`);
  console.log(`[${requestId}] Params:`, {
    userEmail: params.userEmail,
    actionType: params.actionType,
    targetTable: params.targetTable,
    targetId: params.targetId,
    fieldName: params.fieldName,
    newValue: params.newValue,
  });
  console.log('========================================\n');

  try {
    const supabaseAdmin = getSupabaseAdminClient();

    const normalizedTargetId = params.targetId ?? 'null';
    const normalizedFieldName = params.fieldName ?? 'null';
    const normalizedNewValue = params.newValue ?? 'null';

    const rawKey = [
      params.userEmail,
      params.actionType,
      params.targetTable,
      normalizedTargetId,
      normalizedFieldName,
      normalizedNewValue,
    ].join('|');

    const eventHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    console.log(`[${requestId}] Event Hash:`, eventHash);

    

    const now = Date.now();
    const lastExecution = activeLogsCache.get(eventHash);

    if (lastExecution) {
      const diff = now - lastExecution;

      console.warn(
        `[${requestId}] Cache hit! Previous execution ${diff}ms ago`
      );

      if (diff < DUPLICATE_WINDOW_MS) {
        console.warn(
          `[${requestId}] DUPLICATE BLOCKED BY MEMORY CACHE`
        );

        return {
          success: true,
          duplicateIgnored: true,
        };
      }
    }

    activeLogsCache.set(eventHash, now);

    console.log(
      `[${requestId}] Memory cache updated`
    );

    

    if (activeLogsCache.size > 1000) {
      console.log(
        `[${requestId}] Cleaning cache...`
      );

      for (const [key, timestamp] of activeLogsCache.entries()) {
        if (now - timestamp > DUPLICATE_WINDOW_MS * 2) {
          activeLogsCache.delete(key);
        }
      }

      console.log(
        `[${requestId}] Cache size after cleanup:`,
        activeLogsCache.size
      );
    }


    console.log(
      `[${requestId}] Checking database for duplicates...`
    );

    const { data: existingLog, error: selectError } =
      await supabaseAdmin
        .from('activity_logs')
        .select('id')
        .eq('event_hash', eventHash)
        .limit(1);

    if (selectError) {
      console.error(
        `[${requestId}] Duplicate check failed:`,
        selectError
      );
    }

    if (existingLog && existingLog.length > 0) {
      console.warn(
        `[${requestId}] DUPLICATE FOUND IN DATABASE`
      );

      return {
        success: true,
        duplicateIgnored: true,
      };
    }

    console.log(
      `[${requestId}] No duplicate found`
    );

   

    const payload = {
      user_id: params.userId,
      user_email: params.userEmail,
      action_type: params.actionType,
      target_table: params.targetTable,
      target_id: params.targetId ?? null,
      description: params.description,
      field_name: params.fieldName ?? null,
      old_value:
        params.oldValue !== undefined
          ? String(params.oldValue)
          : null,
      new_value:
        params.newValue !== undefined
          ? String(params.newValue)
          : null,
      event_hash: eventHash,
    };

    console.log(
      `[${requestId}] Inserting activity log...`
    );

    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert(payload);

    if (error) {
      console.error(
        `[${requestId}] INSERT FAILED`
      );
      console.error(
        `[${requestId}] Error:`,
        error.message
      );

      return {
        success: false,
        error: error.message,
      };
    }

    const executionTime = Date.now() - startTime;

    console.log(
      `[${requestId}] INSERT SUCCESS`
    );

    console.log(
      `[${requestId}] Execution Time: ${executionTime}ms`
    );

    console.log(
      '========================================'
    );

    return {
      success: true,
    };
  } catch (error: any) {
    console.error(
      `[${requestId}] UNHANDLED ERROR`
    );

    console.error(error);

    return {
      success: false,
      error: error?.message || 'Unknown error',
    };
  }
}
