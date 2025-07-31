import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import Logo from "./assets/logo.png";

function LeaderBoard({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  /**
   * Fetch Leaderboard
   * 
   * Retrieves all users and their assets, calculates portfolio values, and ranks users.
   */

  async function fetchLeaderboard() {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("user_id, symbol, amount");

    if (assetsError) {
      console.error("Error fetching assets:", assetsError);
      return;
    }

    const assetsByUser = {};
    assets.forEach(asset => {
    if (!assetsByUser[asset.user_id]) {
      assetsByUser[asset.user_id] = [];
    }
    assetsByUser[asset.user_id].push(asset);
    });

    const idsMap = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      XRP: "ripple",
      BNB: "binancecoin",
      DOGE: "dogecoin",
      TRX: "tron",
      ADA: "cardano",
      HYPE: "hyperliquid",
      SUI: "sui",
      XLM: "stellar",
      LINK: "chainlink",
      USDT: "tether",
    };

    const coinIds = Object.values(idsMap).join(",");
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}`
      );
      const priceData = await res.json();

      const prices = {};
      priceData.forEach((coin) => {
        const symbol = Object.keys(idsMap).find(
          (key) => idsMap[key] === coin.id
        );
        if (symbol) {
          prices[symbol] = coin.current_price || 0;
        }
      });

      const leaderboardData = users.map((u) => {
        const userAssets = assetsByUser[u.id] || [];
        const totalValue = userAssets.reduce((sum, asset) => {
          const price = prices[asset.symbol.toUpperCase()] || 0;
          return sum + asset.amount * price;
        }, 0);
        return { username: u.username, totalValue };
      });

      leaderboardData.sort((a, b) => b.totalValue - a.totalValue);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white">
      <div className="w-20 bg-[#0f0f0f] border-r border-[#333] flex flex-col items-center pt-2">
        <img src={Logo} alt="Logo" className="w-16 h-auto" />
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center px-5 py-6 border-b border-[#333]">
          <div className="flex gap-4">
            <Link to="/dashboard" className="text-[#aaa] hover:text-white">
              Dashboard
            </Link>
            <Link to="/leaderboard" className="text-[#aaa] hover:text-white">
              Leaderboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span>{user.username}</span>
          </div>
        </div>

        <div className="px-5">
          <div className="mt-8 rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#121212] text-white">
            <table className="w-full text-sm">
              <thead className="bg-[#161616]">
                <tr>
                  <th
                    colSpan="3"
                    className="text-left py-4 px-5 text-base font-semibold text-white"
                  >
                    Top Users by Portfolio Value
                  </th>
                </tr>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-2 px-5 text-left">Rank</th>
                  <th className="py-2 px-5 text-left">Username</th>
                  <th className="py-2 px-5 text-right">Portfolio Value</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => (
                    <tr
                      key={entry.username}
                      className="hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="py-3 px-5">{index + 1}</td>
                      <td className="py-3 px-5">{entry.username}</td>
                      <td className="py-3 px-5 text-right">
                        ${entry.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderBoard;