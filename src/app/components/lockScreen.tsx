import { useState, useEffect } from "react";
import { Lock, ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [machineId, setMachineId] = useState<string>("Loading...");
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. Get the hardware ID from Electron
   const fetchMachineId = async () => {
      try {
        const id = await window.api.system.getMachineId();
        setMachineId(id || "UNKNOWN-DEVICE");
      } catch (err) {
        // ADD THIS CONSOLE.ERROR LINE:
        console.error("HARDWARE ID ERROR:", err);
        setMachineId("ERROR-READING-HARDWARE");
      }
    };
    fetchMachineId();
  }, []);

  // 2. THE SECRET FORMULA (Do not share this string with the gym!)
  const generateExpectedKey = async (id: string) => {
    const secretString = id + "BAKI-GYM-SECRET"; // This is your unique salt
    
    // Scramble it using SHA-256 encryption
    const msgUint8 = new TextEncoder().encode(secretString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // The activation key is the first 12 characters, all uppercase
    return hashHex.substring(0, 12).toUpperCase();
  };

  const handleUnlock = async () => {
    const expectedKey = await generateExpectedKey(machineId);
    
    // Check if what they typed matches the secret formula
    if (inputKey.trim().toUpperCase() === expectedKey) {
      // Save it to the computer so they don't have to type it every day
      localStorage.setItem("gym_activation_key", expectedKey);
      setError(false);
      onUnlock(); // This tells App.tsx to load the real dashboard!
    } else {
      setError(true);
      setInputKey("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-t-8 border-blue-600">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">Software Locked</h1>
        <p className="text-slate-500 text-sm mb-6">
          This software is licensed to a specific device. Please provide your Device ID to the developer to receive your Activation Key.
        </p>

        <div className="bg-slate-100 rounded-lg p-4 mb-6 border border-slate-200 text-left">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Device ID</p>
          <code className="text-blue-700 font-mono font-bold text-sm break-all select-all">
            {machineId}
          </code>
        </div>

        <div className="space-y-4">
          <div>
            <Input 
              placeholder="Enter 12-Character Activation Key" 
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value.toUpperCase());
                setError(false);
              }}
              className={`text-center font-mono font-bold tracking-widest h-12 ${error ? "border-red-500 bg-red-50" : ""}`}
              maxLength={12}
            />
            {error && (
              <p className="text-red-500 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Invalid Activation Key
              </p>
            )}
          </div>

          <Button 
            onClick={handleUnlock}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-bold text-lg"
          >
            <KeyRound className="w-5 h-5 mr-2" />
            Activate Software
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          Protected by Baki Systems
        </div>
      </div>
    </div>
  );
}