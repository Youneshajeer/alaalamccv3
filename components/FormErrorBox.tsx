interface FormErrorBoxProps {
  message?: string | null;
  success?: boolean;
}

export default function FormErrorBox({ message, success }: FormErrorBoxProps) {
  if (!message || success) return null;

  return (
    <div className="p-3 my-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold text-center animate-shake transition-all">
      {message}
    </div>
  );
}