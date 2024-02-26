import yahooFinance from 'yahoo-finance2';

// quote
export const get = async (ticker) => {
    try {
        const data = await yahooFinance.quote(ticker);
        return data;
    } catch (e) {
        return e;
    }
};