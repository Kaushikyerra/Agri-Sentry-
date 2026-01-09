
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface MandiPrice {
    id?: number;
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    grade: string;
    arrival_date: string;
    min_price: number;
    max_price: number;
    modal_price: number;
}

export interface PredictionRequest {
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    grade?: string;
    soilType?: string;
}

export interface PredictionResult {
    date: string;
    predicted_price: number;
}

export interface PredictionResponse {
    commodity: string;
    market: string;
    predictions: PredictionResult[];
}

// Pseudo-random for demo
const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

export const api = {
    async getMandiPrices(state?: string, district?: string, limit: number = 100): Promise<MandiPrice[]> {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        if (district) params.append('district', district);
        params.append('limit', limit.toString());

        const response = await fetch(`${API_BASE_URL}/mandi-prices?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch mandi prices');
        }
        return response.json();
    },

    async predictPrice(data: PredictionRequest): Promise<PredictionResponse> {
        const response = await fetch(`${API_BASE_URL}/predict-price`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to get price prediction');
        }
        return response.json();
    }
};
