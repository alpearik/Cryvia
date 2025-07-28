import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import CryptoCard from "./components/CryptoCard";
import Logo from "./assets/logo.png";

function Dashboard({ user }) {
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchAssets();
    fetchHistory();
  }, []);

  /**
   * Fetch assets
   *
   * Retrieves the user's crypto assets.
   *
   */

  async function fetchAssets() {
    const { data: assetsUser, error: fetchError } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Error fetching assets:", fetchError);
    } else {
      setAssets(assetsUser);
      calculateTotalValue(assetsUser);
    }
  }

  /**
   * Fetch history
   *
   * Retrieves user's transaction history.
   */

  async function fetchHistory() {
    const { data: historyData, error: historyError } = await supabase
      .from("history")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });

    if (historyError) {
      console.error("Error fetching history:", historyError);
    } else {
      setHistory(historyData);
    }
  }

  /**
   * Calculate total value
   *
   * Calculates the total value of the user's assets based on current prices.
   *
   * @param {Array} assetList - List of user's assets.
   */

  async function calculateTotalValue(assetList) {
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

    const allSymbols = Object.keys(idsMap);

    const userAssetsMap = {};
    assetList.forEach((a) => {
      userAssetsMap[a.symbol.toUpperCase()] = a;
    });

    const fullAssetList = allSymbols.map((symbol) => {
      return userAssetsMap[symbol] || { symbol, amount: 0 };
    });

    const coinIds = allSymbols.map((symbol) => idsMap[symbol]).join(",");

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}`
      );
      const result = await res.json();

      let total = 0;
      const newPrices = {};

      const updatedAssets = fullAssetList.map((asset) => {
        const symbol = asset.symbol.toUpperCase();
        const coinData = result.find((c) => c.id === idsMap[symbol]);

        const price = coinData?.current_price || 0;
        const image = coinData?.image || "";

        newPrices[symbol] = {
          price,
          image,
        };

        total += asset.amount * price;

        return Object.assign({}, asset, { image: image });
      });

      setPrices(
        Object.fromEntries(
          Object.entries(newPrices).map(([symbol, { price }]) => [
            symbol,
            price,
          ])
        )
      );
      setAssets(updatedAssets);
      setTotalValue(total);
    } catch (error) {
      console.error("Error fetching prices and images:", error);
    }
  }

  /**
   * Record transaction
   *
   * Records a transaction in the history table.
   *
   * @param {string} symbol - The asset symbol.
   * @param {string} type - The transaction type ('buy' or 'sell').
   * @param {number} amount - The amount of the asset.
   * @param {number} price - The price at which the transaction occurred.
   * @returns {boolean} - Returns true if the transaction was recorded successfully, false otherwise
   */

  async function recordTransaction(symbol, type, amount, price) {
    const { error } = await supabase.from("history").insert({
      user_id: user.id,
      symbol: symbol.toLowerCase(),
      type,
      amount,
      price,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("Error recording transaction:", error);
      return false;
    }
    await fetchHistory();
    return true;
  }

  /**
   * Handle buy
   *
   * Executes a buy transaction for a crypto asset.
   *
   * @param {string} symbol
   * @param {number} amount
   */

  async function handleBuy(symbol, amount) {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const usdtAsset = assets.find((a) => a.symbol.toUpperCase() === "USDT");
    const cost = amount * prices[symbol.toUpperCase()];

    if (!usdtAsset || usdtAsset.amount < cost) {
      alert("Insufficient USDT balance");
      return;
    }

    try {
      const { error: usdtError } = await supabase
        .from("assets")
        .update({ amount: usdtAsset.amount - cost })
        .eq("user_id", user.id)
        .eq("symbol", "usdt");

      if (usdtError) {
        console.log("error:", usdtError);
        return;
      }

      const existingAsset = assets.find(
        (a) => a.symbol.toUpperCase() === symbol.toUpperCase()
      );
      if (existingAsset && existingAsset.amount > 0) {
        const { error: updateError } = await supabase
          .from("assets")
          .update({ amount: existingAsset.amount + amount })
          .eq("user_id", user.id)
          .eq("symbol", symbol.toLowerCase());

        if (updateError) {
          console.log("error:", updateError);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("assets")
          .insert({ user_id: user.id, symbol: symbol.toLowerCase(), amount });

        if (insertError) {
          console.log("error:", insertError);
          return;
        }
      }
      await recordTransaction(
        symbol,
        "buy",
        amount,
        prices[symbol.toUpperCase()]
      );
      await fetchAssets();
      alert(`Successfully bought ${amount} ${symbol}`);
    } catch (error) {
      console.error("Error processing buy:", error);
      alert("Error processing buy transaction");
    }
  }

  /**
   * Handle sell
   *
   * Executes a sell transaction for a crypto asset.
   *
   * @param {string} symbol
   * @param {number} amount
   */

  async function handleSell(symbol, amount) {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const currentAsset = assets.find(
      (a) => a.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!currentAsset || currentAsset.amount < amount) {
      alert("Insufficient asset amount");
      return;
    }

    try {
      const newAmount = currentAsset.amount - amount;
      let assetUpdate;
      if (newAmount === 0) {
        assetUpdate = await supabase
          .from("assets")
          .delete()
          .eq("user_id", user.id)
          .eq("symbol", symbol.toLowerCase());
      } else {
        assetUpdate = await supabase
          .from("assets")
          .update({ amount: newAmount })
          .eq("user_id", user.id)
          .eq("symbol", symbol.toLowerCase());
      }

      if (assetUpdate.error) {
        console.log("error", assetUpdate.error);
      }

      const usdtAsset = assets.find((a) => a.symbol.toUpperCase() === "USDT");
      const proceeds = amount * prices[symbol.toUpperCase()];

      if (usdtAsset) {
        const { error: usdtError } = await supabase
          .from("assets")
          .update({ amount: usdtAsset.amount + proceeds })
          .eq("user_id", user.id)
          .eq("symbol", "usdt");

        if (usdtError) {
          console.log("error:", usdtError);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("assets")
          .insert({ user_id: user.id, symbol: "usdt", amount: proceeds });

        if (insertError) {
          console.log("error:", insertError);
          return;
        }
      }
      await recordTransaction(
        symbol,
        "sell",
        amount,
        prices[symbol.toUpperCase()]
      );
      await fetchAssets();
      alert(`Successfully sold ${amount} ${symbol}`);
    } catch (error) {
      console.error("Error processing sell:", error);
      alert("Error processing sell transaction");
    }
  }

  const usdtAsset = assets.find((a) => a.symbol.toUpperCase() === "USDT");
  const usdtBalance = usdtAsset ? usdtAsset.amount : 0;

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white">
      <div className="w-20 bg-[#0f0f0f] border-r border-[#333] flex flex-col items-center pt-2">
        <img src={Logo} alt="Logo" className="w-16 h-auto" />
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center px-5 py-6 border-b border-[#333]">
          <span className="text-[#aaa]">Dashboard</span>
          <div className="flex items-center gap-4">
            <span>{user.username}</span>
          </div>
        </div>

        <div className="p-5 text-xl">Welcome back, {user.username}</div>

        <div className="px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
              <h3 className="text-[#aaa] text-sm mb-2">Total Portfolio Value</h3>
              <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
              <h3 className="text-[#aaa] text-sm mb-2">Available Balance</h3>
              <p className="text-2xl font-bold text-green-400">${usdtBalance.toFixed(2)} USDT</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {assets
              .filter((asset) => asset.symbol.toUpperCase() !== "USDT")
              .map((asset) => (
                <CryptoCard
                  key={asset.symbol}
                  asset={asset}
                  currentPrice={prices[asset.symbol.toUpperCase()]}
                  image={asset.image}
                  onBuy={handleBuy}
                  onSell={handleSell}
                />
              ))}
          </div>

          <div className="mt-8 rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#121212] text-white">
            <table className="w-full text-sm">
              <thead className="bg-[#161616]">
                <tr>
                  <th
                    colSpan="5"
                    className="text-left py-4 px-5 text-base font-semibold text-white"
                  >
                    Trading History
                  </th>
                </tr>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-2 px-5 text-left">Name</th>
                  <th className="py-2 px-5 text-left">Date</th>
                  <th className="py-2 px-5 text-left">Type</th>
                  <th className="py-2 px-5 text-left">Amount</th>
                  <th className="py-2 px-5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  history.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="py-3 px-5">
                        {transaction.symbol.charAt(0).toUpperCase() +
                          transaction.symbol.slice(1)}
                      </td>
                      <td className="py-3 px-5">
                        {new Date(transaction.timestamp).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={
                            transaction.type === "buy"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-5">{transaction.amount}</td>
                      <td className="py-3 px-5 text-right">
                        $
                        {transaction.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
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

export default Dashboard;
