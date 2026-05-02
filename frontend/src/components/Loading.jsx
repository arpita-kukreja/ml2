export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-12 h-12 border-4 border-gray-800 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium animate-pulse">{message}</p>
    </div>
  );
}
