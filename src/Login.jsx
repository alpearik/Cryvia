import { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "./assets/logo.png";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  /**
   * Handle login
   *
   * Handles login logic: checks if user exists, otherwise creates a new user and assigns initial wallet.
   */

  async function handleLogin() {
    if (!username) return;

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (existingUser) {
      setUser(existingUser);
      navigate("/dashboard");
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ username })
        .select()
        .single();

      if (insertError) {
        console.error(insertError);
        return;
      }
      setUser(newUser);

      const { error: assetError } = await supabase
        .from("assets")
        .insert({ user_id: newUser.id, symbol: "usdt", amount: 1000 });

      if (assetError) console.error("Error assigning wallet :", assetError);
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,_#333333,_#000000)] px-4 sm:px-6 lg:px-8">
      <div className="bg-black/95 border border-white/20 rounded-3xl p-8 sm:p-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center space-y-1 mb-20">
          <img
            src={Logo}
            alt="Cryvia Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain transition-transform duration-300 hover:scale-105"
          />
          <span className="text-white text-3xl sm:text-5xl font-extrabold tracking-wider">
            Cryvia
          </span>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-gray-300 text-base sm:text-lg font-medium block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-sm sm:text-base rounded-xl bg-gray-900/80 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 hover:bg-gray-800/90"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3 text-sm sm:text-base rounded-xl bg-white text-black font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 transform"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
