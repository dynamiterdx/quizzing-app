export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="card" role="alert" aria-live="assertive">
      <strong>Something went wrong.</strong>
      <div className="mt-1 muted" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
      {retry && (
        <div className="mt-2">
          <button onClick={retry}>Try again</button>
        </div>
      )}
    </div>
  );
}
