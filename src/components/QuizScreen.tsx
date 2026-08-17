import React, { useState } from "react";
import { QuizQuestion } from "../types";
import { soundManager } from "../utils/audio";
import { PiggyMascot } from "./PiggyMascot";
import { CheckCircle2, XCircle, Sparkles, ArrowRight, BookOpen } from "lucide-react";

interface QuizScreenProps {
  question: QuizQuestion;
  questionNumber: number; // 1 to 4
  totalQuestions: number; // 4
  onAnswerComplete: (selectedOption: string, isCorrect: boolean, earnedGoldBall: boolean) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  questionNumber,
  totalQuestions = 4,
  onAnswerComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option.trim() === question.correctAnswer.trim();

    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleProceed = () => {
    if (!selectedOption) return;
    soundManager.playClick();
    const isCorrect = selectedOption.trim() === question.correctAnswer.trim();
    onAnswerComplete(selectedOption, isCorrect, isCorrect);
  };

  const isCorrectChoice = (opt: string) => opt.trim() === question.correctAnswer.trim();
  const isPlayerChoice = (opt: string) => selectedOption === opt;

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 select-none bg-white overflow-y-auto">
      {/* Top Header Progress (No time limit) */}
      <header className="w-full flex items-center justify-between pb-2.5 border-b-2 border-amber-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#78350F] text-base">
            第 {questionNumber} / {totalQuestions} 題
          </span>
          <span className="text-xs font-black text-[#B45309] bg-[#FEF3C7] px-3 py-0.5 rounded-full border border-amber-300">
            {question.category}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <span>租稅智慧挑戰</span>
        </div>
      </header>

      {/* Main Question Card */}
      <main className="w-full flex-1 flex flex-col items-center justify-center py-2">
        {/* Mascot & Title */}
        <div className="mb-2 shrink-0">
          <PiggyMascot
            size={70}
            pose={
              isAnswered
                ? selectedOption === question.correctAnswer
                  ? "gold"
                  : "idle"
                : "chef"
            }
          />
        </div>

        <div className="w-full text-left mb-3">
          <h2 className="text-lg sm:text-xl font-black text-[#78350F] leading-snug mb-3 text-center sm:text-left">
            {question.question}
          </h2>

          {/* Options with enlarged text */}
          <div className="space-y-2.5">
            {question.options.map((option, idx) => {
              let btnStyle = "bg-white hover:border-[#DC2626] text-slate-800 border-2 border-slate-200 shadow-xs";

              if (isAnswered) {
                if (isCorrectChoice(option)) {
                  btnStyle = "bg-emerald-50 text-emerald-950 border-3 border-emerald-600 font-black shadow-md ring-2 ring-emerald-400/30";
                } else if (isPlayerChoice(option)) {
                  btnStyle = "bg-rose-50 text-rose-950 border-2 border-rose-500 line-through opacity-80";
                } else {
                  btnStyle = "bg-slate-50 text-slate-400 border-2 border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx + 1}`}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl text-base sm:text-lg font-black transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] focus:outline-none ${btnStyle}`}
                >
                  <span className="leading-snug">{option}</span>
                  {isAnswered && isCorrectChoice(option) && (
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 ml-2" />
                  )}
                  {isAnswered && isPlayerChoice(option) && !isCorrectChoice(option) && (
                    <XCircle className="w-6 h-6 shrink-0 text-rose-600 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Answer Explanation Box (Both for correct & incorrect, with enlarged text and confirmation button) */}
        {isAnswered && (
          <div className="w-full mt-2 animate-in fade-in zoom-in-95 duration-200">
            {selectedOption === question.correctAnswer ? (
              <div className="p-3.5 sm:p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-400 text-emerald-950 flex flex-col gap-2 text-left shadow-sm">
                <div className="flex items-center justify-between gap-1 font-black text-emerald-800 text-base sm:text-lg border-b border-emerald-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>恭喜答對！升級紫金彈珠</span>
                  </span>
                  <span className="text-xs font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                    得分 2 倍！
                  </span>
                </div>
                {/* Enlarged explanation text */}
                <div className="text-sm sm:text-base text-emerald-900 font-bold leading-relaxed flex items-start gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                  <span>{question.explanation}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 bg-rose-50 rounded-2xl border-2 border-rose-300 text-rose-950 flex flex-col gap-2 text-left shadow-sm">
                <div className="flex items-center justify-between gap-1 font-black text-[#DC2626] text-base sm:text-lg border-b border-rose-200 pb-1.5">
                  <span>答錯了！正確答案是：【{question.correctAnswer}】</span>
                  <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                    紫色彈珠
                  </span>
                </div>
                {/* Enlarged explanation text */}
                <div className="text-sm sm:text-base text-rose-950 font-bold leading-relaxed flex items-start gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#DC2626] shrink-0 mt-1" />
                  <span>{question.explanation}</span>
                </div>
              </div>
            )}

            {/* Read Confirmation Action Button */}
            <button
              id="confirm-read-btn"
              onClick={handleProceed}
              className="w-full py-3.5 px-6 btn-editorial-red rounded-2xl text-base sm:text-lg font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] mt-3 focus:outline-none"
            >
              <span>已閱讀，前往彈珠挑戰</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Footer hint */}
      {!isAnswered && (
        <footer className="w-full text-center text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 shrink-0">
          請點選正確答案 ‧ 答對可獲得 2 倍得分紫金彈珠
        </footer>
      )}
    </div>
  );
};
