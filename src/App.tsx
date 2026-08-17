import React, { useState } from "react";
import { GameScreen, QuizQuestion, RedemptionRecord } from "./types";
import { getRandomFourQuestions } from "./data/questions";
import { soundManager } from "./utils/audio";
import { HomeScreen } from "./components/HomeScreen";
import { QuizScreen } from "./components/QuizScreen";
import { PinballScreen } from "./components/PinballScreen";
import { ResultScreen } from "./components/ResultScreen";
import { SuccessScreen } from "./components/SuccessScreen";
import { AdminModal } from "./components/AdminModal";
import { AdminDashboard } from "./components/AdminDashboard";

export default function App() {
  // Navigation & Game State
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("HOME");
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Game Playthrough State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1); // 1 to 4
  const [currentBallIsGold, setCurrentBallIsGold] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalPinballScore, setTotalPinballScore] = useState<number>(0);
  const [successRecord, setSuccessRecord] = useState<RedemptionRecord | null>(null);

  const handleToggleMute = () => {
    const nextMute = soundManager.toggleMute();
    setIsMuted(nextMute);
  };

  // Start new game with 4 tax questions
  const handleStartGame = () => {
    const drawnQuestions = getRandomFourQuestions();
    setQuestions(drawnQuestions);
    setCurrentRound(1);
    setCorrectCount(0);
    setTotalPinballScore(0);
    setCurrentBallIsGold(false);
    setCurrentScreen("QUIZ");
  };

  // Callback when a quiz question is answered
  const handleAnswerComplete = (
    _selectedOption: string,
    isCorrect: boolean,
    earnedGoldBall: boolean
  ) => {
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setCurrentBallIsGold(earnedGoldBall);
    setCurrentScreen("PINBALL");
  };

  // Callback when a pinball round finishes (total 4 rounds)
  const handleBallFinish = (roundScore: number) => {
    setTotalPinballScore((prev) => prev + roundScore);

    if (currentRound < 4) {
      // Proceed to Next Question
      setCurrentRound((prev) => prev + 1);
      setCurrentScreen("QUIZ");
    } else {
      // Game complete! Proceed to Settlement/Result Screen
      setCurrentScreen("RESULT");
    }
  };

  // Callback when redemption code 7777 is successfully verified
  const handleRedeemSuccess = (record: RedemptionRecord) => {
    setSuccessRecord(record);
    setCurrentScreen("SUCCESS");
  };

  // Admin login handling
  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    setIsAdminOpen(false);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
  };

  // If Admin is logged in, show Admin Dashboard view
  if (adminToken) {
    return (
      <AdminDashboard token={adminToken} onLogout={handleAdminLogout} />
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#FEF3C7] pig-bg flex flex-col justify-center items-center p-1 sm:p-4 overflow-hidden selection:bg-rose-200 selection:text-rose-950">
      {/* Editorial Game Frame */}
      <div className="relative w-full max-w-[420px] h-full max-h-[100dvh] sm:max-h-[820px] bg-white rounded-[24px] sm:rounded-[36px] border-[5px] sm:border-[10px] border-[#78350F] shadow-2xl flex flex-col overflow-hidden my-auto">
        {currentScreen === "HOME" && (
          <HomeScreen
            onStart={handleStartGame}
            onOpenAdmin={() => setIsAdminOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {currentScreen === "QUIZ" && questions.length >= currentRound && (
          <QuizScreen
            question={questions[currentRound - 1]}
            questionNumber={currentRound}
            totalQuestions={4}
            onAnswerComplete={handleAnswerComplete}
          />
        )}

        {currentScreen === "PINBALL" && (
          <PinballScreen
            ballNumber={currentRound}
            totalBalls={4}
            isGoldBall={currentBallIsGold}
            totalScoreSoFar={totalPinballScore}
            onBallFinish={handleBallFinish}
          />
        )}

        {currentScreen === "RESULT" && (
          <ResultScreen
            correctCount={correctCount}
            totalQuestions={4}
            totalScore={totalPinballScore}
            onRedeemSuccess={handleRedeemSuccess}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}

        {currentScreen === "SUCCESS" && successRecord && (
          <SuccessScreen
            record={successRecord}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}
      </div>

      {/* Staff Entrance Password Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
