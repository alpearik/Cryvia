import React, { useState } from "react";

const CryptoCard = ({ asset, currentPrice, image, onBuy, onSell }) => {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  return (
    <div className="bg-[#0f0f0f] border border-[#333] rounded-2xl p-4 w-72 text-white">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={image}
          alt={asset.symbol}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h3 className="text-lg font-semibold">{asset.name}</h3>
          <p className="text-sm text-gray-400">{asset.symbol.toUpperCase()}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold">
          ${currentPrice ? currentPrice.toLocaleString() : "0"}
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-1 mb-4">
        <p>Amount: {asset.amount.toFixed(4)}</p>
        <p>Value: ${(asset.amount * (currentPrice || 0)).toFixed(2)}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Buy amount"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            min="0"
            className="flex-1 px-2 py-1 rounded bg-[#1a1a1a] text-white border border-gray-700 text-sm"
          />
          <button
            onClick={() => {
              onBuy(asset.symbol, parseFloat(buyAmount));
              setBuyAmount("");
            }}
            disabled={!buyAmount || parseFloat(buyAmount) <= 0}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Buy
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Sell amount"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            min="0"
            max={asset.amount}
            className="flex-1 px-2 py-1 rounded bg-[#1a1a1a] text-white border border-gray-700 text-sm"
          />
          <button
            onClick={() => {
              onSell(asset.symbol, parseFloat(sellAmount));
              setSellAmount("");
            }}
            disabled={
              !sellAmount ||
              parseFloat(sellAmount) <= 0 ||
              parseFloat(sellAmount) > asset.amount
            }
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;
