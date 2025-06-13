interface ScoreDisplayProps {
    label: string;
    value: number;
  }
  
  export default function ScoreDisplay({ label, value }: ScoreDisplayProps) {
    return (
      <div className="flex gap-2">
        <strong>{label}:</strong>
        <span>{value}</span>
      </div>
    );
  }