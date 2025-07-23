import React from 'react';

const CryptoCard = ({asset, currentPrice, onBuy, onSell}) => {
  return (
    <div>
      <div>
        <h3>{asset.symbol.toUpperCase()}</h3>
        <p>Amount: {asset.amount}</p>
        <p>Price: ${currentPrice ? currentPrice.toFixed(2) : '0'}</p>
        <p>Value: ${(asset.amount * (currentPrice || 0))}</p>
      </div>
      <div>
        <button onClick={() => onBuy(asset.symbol)}>
          Buy
        </button>
        <button onClick={() => onSell(asset.symbol)}>
          Sell
        </button>
      </div>
    </div>
  );
};

export default CryptoCard;