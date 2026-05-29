import type { StockDef, SectorGroup } from './kr-stocks'

export type { StockDef, SectorGroup }

export const US_SECTORS: SectorGroup[] = [
  {
    sector: '빅테크',
    stocks: [
      { name: 'Apple', ticker: 'AAPL' },
      { name: 'Microsoft', ticker: 'MSFT' },
      { name: 'Google', ticker: 'GOOGL' },
      { name: 'Meta', ticker: 'META' },
      { name: 'Amazon', ticker: 'AMZN' },
    ],
  },
  {
    sector: '반도체/AI',
    stocks: [
      { name: 'NVIDIA', ticker: 'NVDA' },
      { name: 'AMD', ticker: 'AMD' },
      { name: 'Broadcom', ticker: 'AVGO' },
      { name: 'Qualcomm', ticker: 'QCOM' },
      { name: 'Texas Inst.', ticker: 'TXN' },
      { name: 'Micron', ticker: 'MU' },
      { name: 'Intel', ticker: 'INTC' },
      { name: 'Applied Mat.', ticker: 'AMAT' },
      { name: 'Lam Research', ticker: 'LRCX' },
      { name: 'KLA', ticker: 'KLAC' },
    ],
  },
  {
    sector: '소프트웨어/클라우드',
    stocks: [
      { name: 'Oracle', ticker: 'ORCL' },
      { name: 'Salesforce', ticker: 'CRM' },
      { name: 'Adobe', ticker: 'ADBE' },
      { name: 'ServiceNow', ticker: 'NOW' },
      { name: 'Snowflake', ticker: 'SNOW' },
      { name: 'Palantir', ticker: 'PLTR' },
    ],
  },
  {
    sector: '우주',
    stocks: [
      { name: 'Rocket Lab', ticker: 'RKLB' },
      { name: 'Planet Labs', ticker: 'PL' },
      { name: 'Iridium', ticker: 'IRDM' },
      { name: 'Redwire', ticker: 'RDW' },
      { name: 'AST SpaceMobile', ticker: 'ASTS' },
      { name: 'Intuitive Mach.', ticker: 'LUNR' },
      { name: 'Viasat', ticker: 'VSAT' },
      { name: 'BlackSky', ticker: 'BKSY' },
    ],
  },
  {
    sector: '인터넷/플랫폼',
    stocks: [
      { name: 'Netflix', ticker: 'NFLX' },
      { name: 'Uber', ticker: 'UBER' },
      { name: 'Airbnb', ticker: 'ABNB' },
      { name: 'Booking', ticker: 'BKNG' },
      { name: 'Spotify', ticker: 'SPOT' },
    ],
  },
  {
    sector: '전자/하드웨어',
    stocks: [
      { name: 'Tesla', ticker: 'TSLA' },
      { name: 'Dell', ticker: 'DELL' },
      { name: 'HP', ticker: 'HPQ' },
      { name: 'Seagate', ticker: 'STX' },
      { name: 'Western Dig.', ticker: 'WDC' },
    ],
  },
  {
    sector: '금융/은행',
    stocks: [
      { name: 'JPMorgan', ticker: 'JPM' },
      { name: 'BofA', ticker: 'BAC' },
      { name: 'Goldman', ticker: 'GS' },
      { name: 'Morgan Stly', ticker: 'MS' },
      { name: 'Wells Fargo', ticker: 'WFC' },
      { name: 'Citigroup', ticker: 'C' },
      { name: 'Berkshire', ticker: 'BRK-B' },
      { name: 'Schwab', ticker: 'SCHW' },
    ],
  },
  {
    sector: '결제/핀테크',
    stocks: [
      { name: 'Visa', ticker: 'V' },
      { name: 'Mastercard', ticker: 'MA' },
      { name: 'Amex', ticker: 'AXP' },
      { name: 'PayPal', ticker: 'PYPL' },
      { name: 'Capital One', ticker: 'COF' },
    ],
  },
  {
    sector: '헬스케어',
    stocks: [
      { name: 'UnitedHealth', ticker: 'UNH' },
      { name: 'Eli Lilly', ticker: 'LLY' },
      { name: 'J&J', ticker: 'JNJ' },
      { name: 'AbbVie', ticker: 'ABBV' },
      { name: 'Merck', ticker: 'MRK' },
      { name: 'Pfizer', ticker: 'PFE' },
      { name: 'Amgen', ticker: 'AMGN' },
      { name: 'Thermo Fisher', ticker: 'TMO' },
      { name: 'Abbott', ticker: 'ABT' },
      { name: 'Intuitive Surg', ticker: 'ISRG' },
    ],
  },
  {
    sector: '에너지',
    stocks: [
      { name: 'ExxonMobil', ticker: 'XOM' },
      { name: 'Chevron', ticker: 'CVX' },
      { name: 'ConocoPhil.', ticker: 'COP' },
      { name: 'Schlumberger', ticker: 'SLB' },
      { name: 'EOG Res.', ticker: 'EOG' },
      { name: 'Marathon Pete.', ticker: 'MPC' },
    ],
  },
  {
    sector: '원자재',
    stocks: [
      { name: '금 ETF', ticker: 'GLD' },
      { name: '금광 ETF', ticker: 'GDX' },
      { name: 'Newmont', ticker: 'NEM' },
      { name: 'Barrick Gold', ticker: 'GOLD' },
      { name: '리튬 ETF', ticker: 'LIT' },
      { name: 'Albemarle', ticker: 'ALB' },
      { name: 'SQM', ticker: 'SQM' },
      { name: 'Freeport', ticker: 'FCX' },
    ],
  },
  {
    sector: '소비재',
    stocks: [
      { name: 'Walmart', ticker: 'WMT' },
      { name: 'Costco', ticker: 'COST' },
      { name: 'Home Depot', ticker: 'HD' },
      { name: "McDonald's", ticker: 'MCD' },
      { name: 'Nike', ticker: 'NKE' },
      { name: 'Starbucks', ticker: 'SBUX' },
      { name: 'Target', ticker: 'TGT' },
      { name: "Lowe's", ticker: 'LOW' },
    ],
  },
  {
    sector: '필수소비재',
    stocks: [
      { name: 'P&G', ticker: 'PG' },
      { name: 'Coca-Cola', ticker: 'KO' },
      { name: 'PepsiCo', ticker: 'PEP' },
      { name: 'Philip Morris', ticker: 'PM' },
      { name: 'Altria', ticker: 'MO' },
      { name: 'Colgate', ticker: 'CL' },
    ],
  },
  {
    sector: '산업/기계',
    stocks: [
      { name: 'GE Aerospace', ticker: 'GE' },
      { name: 'Caterpillar', ticker: 'CAT' },
      { name: 'Honeywell', ticker: 'HON' },
      { name: 'Deere', ticker: 'DE' },
      { name: 'Eaton', ticker: 'ETN' },
      { name: 'Emerson', ticker: 'EMR' },
      { name: 'Union Pacific', ticker: 'UNP' },
      { name: 'FedEx', ticker: 'FDX' },
    ],
  },
  {
    sector: '방산',
    stocks: [
      { name: 'RTX', ticker: 'RTX' },
      { name: 'Lockheed', ticker: 'LMT' },
      { name: 'Northrop', ticker: 'NOC' },
      { name: 'Boeing', ticker: 'BA' },
      { name: 'Gen. Dynamics', ticker: 'GD' },
    ],
  },
  {
    sector: '통신/미디어',
    stocks: [
      { name: 'T-Mobile', ticker: 'TMUS' },
      { name: 'AT&T', ticker: 'T' },
      { name: 'Verizon', ticker: 'VZ' },
      { name: 'Disney', ticker: 'DIS' },
      { name: 'Comcast', ticker: 'CMCSA' },
    ],
  },
  {
    sector: '부동산',
    stocks: [
      { name: 'American Tower', ticker: 'AMT' },
      { name: 'Prologis', ticker: 'PLD' },
      { name: 'Equinix', ticker: 'EQIX' },
      { name: 'Simon Prop.', ticker: 'SPG' },
    ],
  },
  {
    sector: '유틸리티',
    stocks: [
      { name: 'NextEra', ticker: 'NEE' },
      { name: 'Duke Energy', ticker: 'DUK' },
      { name: 'Southern Co.', ticker: 'SO' },
    ],
  },
]

export const ALL_US_TICKERS = US_SECTORS.flatMap((s) =>
  s.stocks.map((st) => st.ticker)
)
