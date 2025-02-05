import { request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { BASE_URL } from '../config/config';

let apiContext: APIRequestContext;

export const initApiContext = async () => {
  apiContext = await playwrightRequest.newContext();
};

export const fetchExchangeRates = async (currencyPairs: string[], queryParams: string = '') => {
  const fxPath = currencyPairs.join('%2C'); // Join pairs with URL-encoded comma
  const url = `${BASE_URL}/${fxPath}/json${queryParams ? `?${queryParams}` : ''}`;
  const response = await apiContext.get(url);

  if (!response.ok()) {
    throw new Error(`Failed to fetch data (Status: ${response.status()} - ${response.statusText()})`);
  }
  // const data = await response.json();
  // console.log(JSON.stringify(data, null, 2));
  return response.json();
};

export const closeApiContext = async () => {
  await apiContext.dispose();
};