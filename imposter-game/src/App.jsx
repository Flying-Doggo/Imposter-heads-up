import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Eye,
  EyeOff,
  Crown,
  Timer,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Play,
  Skull
} from 'lucide-react';

// --- Game Data & Constants ---
// Format: { secret: "The Real Thing", decoy: "The Vague Hint/Decoy" }
const CATEGORIES = {
  "Animals": [
    { secret: "Lion", decoy: "Wild Beast" },
    { secret: "Penguin", decoy: "Cold Climate Creature" },
    { secret: "Giraffe", decoy: "Herbivore" },
    { secret: "Elephant", decoy: "Grey Animal" },
    { secret: "Shark", decoy: "Ocean Predator" },
    { secret: "Eagle", decoy: "Flying Creature" },
    { secret: "Kangaroo", decoy: "Australian Native" },
    { secret: "Frog", decoy: "Pond Dweller" },
    { secret: "Snake", decoy: "Scaly Creature" }
  ],
  "Places": [
    { secret: "Hospital", decoy: "Emergency Location" },
    { secret: "School", decoy: "Public Institution" },
    { secret: "Beach", decoy: "Vacation Spot" },
    { secret: "Library", decoy: "Quiet Zone" },
    { secret: "Gym", decoy: "Training Area" },
    { secret: "Cinema", decoy: "Ticketed Venue" },
    { secret: "Museum", decoy: "Tourist Attraction" },
    { secret: "Restaurant", decoy: "Social Gathering Spot" }
  ],
  "Food": [
    { secret: "Pizza", decoy: "Party Food" },
    { secret: "Sushi", decoy: "Expensive Meal" },
    { secret: "Ice Cream", decoy: "Sweet Treat" },
    { secret: "Hamburger", decoy: "American Food" },
    { secret: "Taco", decoy: "Street Food" },
    { secret: "Spaghetti", decoy: "Dinner Dish" },
    { secret: "Popcorn", decoy: "Crunchy Snack" },
    { secret: "Donut", decoy: "Breakfast Item" }
  ],
  "Objects": [
    { secret: "Laptop", decoy: "Work Tool" },
    { secret: "Guitar", decoy: "Wooden Object" },
    { secret: "Sofa", decoy: "Comfortable Spot" },
    { secret: "Toaster", decoy: "Heating Device" },
    { secret: "Bicycle", decoy: "Transport Mode" },
    { secret: "Camera", decoy: "Travel Accessory" },
    { secret: "Umbrella", decoy: "Protective Gear" },
    { secret: "Clock", decoy: "Wall Decoration" }
  ]
};

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 7;
const ROUNDS_TOTAL = 3;
const TURN_TIME_SEC = 20;

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, disabled, variant = "primary", children, className = "" }) => {
  const baseStyle = "w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50",
    secondary: "bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// --- Main Application ---

export default function ImpostorGame() {
  // Game States: 'setup' | 'assign' | 'reveal' | 'playing' | 'voting' | 'results'
  const [gameState, setGameState] = useState('setup');
 
  // Data State
  const [players, setPlayers] = useState(['', '', '']); // Start with 3 slots
  const [category, setCategory] = useState('Random');
  const [secretWord, setSecretWord] = useState('');
  const [decoyWord, setDecoyWord] = useState('');
  const [impostorIndex, setImpostorIndex] = useState(null);
 
  // Gameplay State
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false); // True when holding button to see role
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_SEC);
  const [timerActive, setTimerActive] = useState(false);
  const [voteSelection, setVoteSelection] = useState(null);

  // Timers
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // --- Actions ---

  const handleAddPlayer = () => {
    if (players.length < MAX_PLAYERS) setPlayers([...players, '']);
  };

  const handleRemovePlayer = (idx) => {
    if (players.length > MIN_PLAYERS) {
      const newPlayers = [...players];
      newPlayers.splice(idx, 1);
      setPlayers(newPlayers);
    }
  };

  const handleNameChange = (idx, val) => {
    const newPlayers = [...players];
    newPlayers[idx] = val;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    // 1. Validate names
    const validPlayers = players.map(p => p.trim()).filter(p => p !== '');
    if (validPlayers.length < MIN_PLAYERS) return;
   
    // 2. Select Word Pair
    let selectedCat = category;
    if (category === 'Random') {
      const cats = Object.keys(CATEGORIES);
      selectedCat = cats[Math.floor(Math.random() * cats.length)];
    }
    const pairs = CATEGORIES[selectedCat];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];

    // 3. Assign Impostor
    const impIdx = Math.floor(Math.random() * validPlayers.length);

    setPlayers(validPlayers);
    setSecretWord(pair.secret);
    setDecoyWord(pair.decoy);
    setImpostorIndex(impIdx);
    setCurrentRevealIndex(0);
    setGameState('assign');
  };

  const nextReveal = () => {
    if (currentRevealIndex < players.length - 1) {
      setCurrentRevealIndex(currentRevealIndex + 1);
      setIsRevealing(false);
    } else {
      // Done revealing
      setGameState('playing');
      setCurrentRound(1);
      setCurrentPlayerTurn(0);
      setTimeLeft(TURN_TIME_SEC);
      setTimerActive(false);
    }
  };

  const nextTurn = () => {
    setTimerActive(false);
    setTimeLeft(TURN_TIME_SEC);
   
    const nextPlayer = (currentPlayerTurn + 1) % players.length;
   
    // Check if round is over
    if (nextPlayer === 0) {
      if (currentRound < ROUNDS_TOTAL) {
        setCurrentRound(currentRound + 1);
        setCurrentPlayerTurn(0);
      } else {
        setGameState('voting');
      }
    } else {
      setCurrentPlayerTurn(nextPlayer);
    }
  };

  const handleVote = (idx) => {
    setVoteSelection(idx);
    setGameState('results');
  };

  const resetGame = () => {
    setGameState('setup');
    setVoteSelection(null);
    setCurrentRound(1);
    setIsRevealing(false);
    // Keep player names for convenience
  };

  const playAgainSamePlayers = () => {
    setGameState('setup');
    setVoteSelection(null);
    // Shortcut to just restart immediately if needed, but going to setup allows cat change
  };


  // --- Render Functions ---

  // 1. Setup Screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 uppercase tracking-tighter">
              Impostor
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Detective vs Deceiver</p>
          </div>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Players
              </h2>
              <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                {players.length} / {MAX_PLAYERS}
              </span>
            </div>
           
            <div className="space-y-3 mb-6">
              {players.map((name, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Player ${idx + 1} Name`}
                    value={name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {players.length > MIN_PLAYERS && (
                    <button
                      onClick={() => handleRemovePlayer(idx)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {players.length < MAX_PLAYERS && (
                <button
                  onClick={handleAddPlayer}
                  className="w-full py-2 border border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-indigo-500 hover:text-indigo-400 transition-colors text-sm font-medium"
                >
                  + Add Player
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {['Random', ...Object.keys(CATEGORIES)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      category === cat
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Button
            onClick={startGame}
            disabled={players.some(p => !p.trim())}
            variant="primary"
          >
            Start Game <ArrowRight className="w-5 h-5" />
          </Button>
         
          <p className="text-center text-xs text-gray-500">
             Minimum 3 players required.
          </p>
        </div>
      </div>
    );
  }

  // 2. Assign/Reveal Screen
  if (gameState === 'assign') {
    const currentPlayerName = players[currentRevealIndex];
    const isImpostor = currentRevealIndex === impostorIndex;

    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-8 text-center">
         
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-300">Pass the device to</h2>
            <h1 className="text-5xl font-black text-white">{currentPlayerName}</h1>
          </div>

          <Card className="min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
            {isRevealing ? (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 ${isImpostor ? 'bg-red-900/95' : 'bg-indigo-900/95'}`}>
                {isImpostor ? (
                  <>
                    <AlertTriangle className="w-16 h-16 text-red-400 mb-4 animate-bounce" />
                    <h3 className="text-2xl font-black text-red-100 uppercase mb-2">You are the Impostor</h3>
                    <p className="text-red-200 mb-4">You don't know the secret word!</p>
                   
                    <div className="bg-black/40 p-4 rounded-lg border border-red-500/50 w-full">
                      <p className="text-red-200 text-xs uppercase tracking-wider mb-1">Your Context Hint</p>
                      <p className="text-3xl font-bold text-white uppercase">{decoyWord}</p>
                    </div>
                    <p className="text-red-200 text-xs mt-4">The others have a specific word related to this.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-medium text-emerald-200 mb-1">Your Secret Word:</h3>
                    <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">{secretWord}</h1>
                    <p className="text-emerald-200/60 text-sm">Category: {category === 'Random' ? 'Random' : category}</p>
                    <p className="text-emerald-200/60 text-xs mt-4">Describe this so the group knows you're innocent.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <HelpCircle className="w-16 h-16 text-gray-600" />
                <p className="text-gray-400 font-medium">Touch and hold to reveal your role</p>
              </div>
            )}
          </Card>

          <div
            className="select-none touch-none"
            onMouseDown={() => setIsRevealing(true)}
            onMouseUp={() => setIsRevealing(false)}
            onTouchStart={() => setIsRevealing(true)}
            onTouchEnd={() => setIsRevealing(false)}
          >
            <Button variant={isRevealing ? "secondary" : "primary"} className="h-16 text-lg">
              {isRevealing ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
              {isRevealing ? "Release to Hide" : "Hold to Reveal"}
            </Button>
          </div>

          {!isRevealing && (
            <Button onClick={nextReveal} variant="ghost" className="text-sm">
              I have seen my role (Next Player)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 3. Gameplay Screen
  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Round</span>
            <span className="text-2xl font-bold text-white">{currentRound} <span className="text-gray-600 text-lg">/ {ROUNDS_TOTAL}</span></span>
          </div>
          <button
            onClick={() => setGameState('voting')}
            className="px-3 py-1 bg-red-900/50 text-red-400 border border-red-800 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-900 transition-colors"
          >
            Emergency Vote
          </button>
        </div>

        {/* Main Action Area */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
         
          <div className="text-center space-y-2">
            <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Current Turn</p>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
              {players[currentPlayerTurn]}
            </h1>
          </div>

          <div className="w-full max-w-xs">
            {timerActive ? (
              <div className="flex flex-col items-center space-y-4">
                <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${timeLeft < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-indigo-500 text-indigo-400'} bg-gray-800`}>
                  <span className="text-5xl font-mono font-bold">{timeLeft}</span>
                </div>
                <p className="text-sm text-gray-400 text-center animate-pulse">Describe your word!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                 <div className="w-32 h-32 rounded-full border-4 border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500">
                    <Timer className="w-12 h-12" />
                 </div>
                 <p className="text-sm text-gray-400 text-center">Ready to start turn?</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 mb-4 space-y-3">
          {!timerActive && timeLeft === TURN_TIME_SEC ? (
            <Button onClick={() => setTimerActive(true)} variant="primary" className="h-16 text-lg">
              <Play className="w-6 h-6 fill-current" /> Start Timer
            </Button>
          ) : (
            <Button onClick={nextTurn} variant={timeLeft === 0 ? "secondary" : "success"} className="h-16 text-lg">
              {timeLeft === 0 ? "Time's Up! Next Player" : "Finished Turn"} <ArrowRight className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 4. Voting Screen
  if (gameState === 'voting') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2 mb-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Who is the Impostor?</h1>
            <p className="text-gray-400">The group must decide on one person.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {players.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleVote(idx)}
                className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all group"
              >
                <span className="font-bold text-lg">{p}</span>
                <span className="opacity-0 group-hover:opacity-100 text-red-400 font-bold text-sm tracking-wider uppercase">
                  Accuse
                </span>
              </button>
            ))}
          </div>

          <div className="pt-8 text-center">
             <p className="text-xs text-gray-500">Discuss before you tap!</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Results Screen
  if (gameState === 'results') {
    const imposterCaught = voteSelection === impostorIndex;
    const impostorName = players[impostorIndex];

    return (
      <div className={`min-h-screen p-6 flex flex-col items-center justify-center text-center ${imposterCaught ? 'bg-emerald-900' : 'bg-red-900'}`}>
        <div className="w-full max-w-md space-y-8 animate-in zoom-in duration-500">
         
          <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
            {imposterCaught ? (
              <>
                <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                <h1 className="text-4xl font-black text-white mb-2">Crew Wins!</h1>
                <p className="text-emerald-200 text-lg">You caught the Impostor.</p>
              </>
            ) : (
              <>
                <Skull className="w-20 h-20 text-white mx-auto mb-4" />
                <h1 className="text-4xl font-black text-white mb-2">Impostor Wins!</h1>
                <p className="text-red-200 text-lg">They escaped detection.</p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-black/20 p-4 rounded-xl">
              <p className="text-white/60 text-sm uppercase tracking-wider mb-1">The Impostor was</p>
              <p className="text-3xl font-bold text-white">{impostorName}</p>
              <p className="text-white/40 text-xs mt-1">(Hint was: {decoyWord})</p>
            </div>
           
            <div className="bg-black/20 p-4 rounded-xl">
              <p className="text-white/60 text-sm uppercase tracking-wider mb-1">The Secret Word was</p>
              <p className="text-3xl font-bold text-white">{secretWord}</p>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <Button onClick={playAgainSamePlayers} variant="primary">
              <RefreshCw className="w-5 h-5" /> Play Again
            </Button>
            <Button onClick={resetGame} variant="ghost" className="text-white/60 hover:text-white">
              Change Players
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
