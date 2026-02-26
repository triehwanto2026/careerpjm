import { Question } from "@/data/questions";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onAnswer: (questionId: number, value: string) => void;
  showEnglish: boolean;
}

const QuestionCard = ({ question, selectedAnswer, onAnswer, showEnglish }: QuestionCardProps) => {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="space-y-2">
        <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {question.category}
        </span>
        <h3 className="text-lg font-semibold leading-relaxed text-foreground">
          {question.textId}
        </h3>
        {showEnglish && (
          <p className="text-sm italic text-muted-foreground">{question.textEn}</p>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.value;
          return (
            <button
              key={option.id}
              onClick={() => onAnswer(question.id, option.value)}
              className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 glow-border"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 text-transparent group-hover:border-primary/60"
                }`}
              >
                ✓
              </span>
              <div>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                {showEnglish && (
                  <span className="block text-xs text-muted-foreground">{option.labelEn}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
