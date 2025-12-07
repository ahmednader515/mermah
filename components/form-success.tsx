interface FormSuccessProps {
  message?: string;
}

export const FormSuccess = ({
  message,
}: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className="bg-sky-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-sky-600">
      <p>{message}</p>
    </div>
  );
}; 