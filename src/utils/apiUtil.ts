import { request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { BASE_URL } from '../config/config';

let apiContext: APIRequestContext;

export const initApiContext = async () => {
  apiContext = await playwrightRequest.newContext();
};

export const closeApiContext = async () => {
  await apiContext.dispose();
};

export const fetchExchangeRates = async (baseCurrency: string, targetCurrency: string, queryParams: string = '') => {
  const url = `${BASE_URL}/FX${baseCurrency}${targetCurrency}/json${queryParams ? `?${queryParams}` : ''}`;
  const response = await apiContext.get(url);
  if (!response.ok()) {
    throw new Error(`Failed to fetch data (Status: ${response.status()} - ${response.statusText()})`);
  }
  return response.json(); // Directly parse JSON
};