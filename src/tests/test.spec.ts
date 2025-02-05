import { test, expect } from '@playwright/test';
import { fetchExchangeRates, initApiContext } from '../utils/apiUtils';
import generateHTMLReport from '../utils/generateReport';
import path from 'path';
import fs from 'fs';
import generateHTMLReportWithAverages from '../utils/generateReport';

const currenciesList = [
    { base: 'CAD', target: 'USD', weeks: '10' },
    // { base: 'CAD', target: 'AUD', weeks: '10' },
    // { base: 'CAD', target: 'EUR', weeks: '10' },
];

test.beforeAll(async () => {
    await initApiContext();
});
test.describe('Forex API Tests', () => {
    test('should fetch exchange rates for all specified currency pairs', async () => {

        // Verify that all entries have the same 'weeks' parameter
        const weeksValues = [...new Set(currenciesList.map(c => c.weeks))];
        if (weeksValues.length !== 1) {
            throw new Error('All currency entries must have the same "weeks" value');
        }
        const weeks = weeksValues[0];
        const queryParams = `recent_weeks=${weeks}`;

        // Generate the list of currency pair strings (e.g., ['FXCADAUD'])
        const currencyPairs = currenciesList.map(c => `FX${c.base}${c.target}`);

        // Fetch data in a single API call
        const data = await fetchExchangeRates(currencyPairs, queryParams);

        // Dynamic report data for each currency pair
        const reportData = currenciesList.flatMap((pair) =>
            data.observations.map((obs: any) => ({
                date: obs.d,
                value: obs[`FX${pair.base}${pair.target}`]?.v || 'N/A',
                currency: `${pair.base} to ${pair.target}`,
            }))
        );

        // Map through the currenciesList to calculate average for each currency pair
        const averages = currenciesList.map((pair) => {
            const values = data.observations.map((obs: any) =>
                parseFloat(obs[`FX${pair.base}${pair.target}`]?.v || '0')
            );
            const total = values.reduce((sum: number, value: number) => sum + value, 0);
            const average = values.length > 0 ? total / values.length : 0; // Handle empty lists

            return {
                currencyPair: `${pair.base} to ${pair.target}`,
                average: average
            };
        });

        //generate a separate HTML report for each pair or add averages to the report as follows:
        await generateHTMLReportWithAverages(averages);

        // Positive assertions
        expect(data).toBeDefined();
        expect(data).toHaveProperty('observations');
        expect(data.observations).toBeInstanceOf(Array);
        expect(data.observations.length).toBeGreaterThan(0);

        // Assertions for each observation and pair
        data.observations.forEach((obs: any) => {
            currenciesList.forEach((pair) => {
                const currencyPairKey = `FX${pair.base}${pair.target}`;
                // Check that each observation has a date
                expect(obs).toHaveProperty('d');
                expect(typeof obs.d).toBe('string');
                expect(obs.d).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Validate date format YYYY-MM-DD

                // Check that each observation has an exchange rate value
                expect(obs).toHaveProperty(currencyPairKey);
                expect(obs[currencyPairKey]).toHaveProperty('v');
                expect(typeof obs[currencyPairKey].v).toBe('string'); // or 'number' if it's a number

                // Optionally, validate the value format (e.g., is it a number?)
                expect(!isNaN(parseFloat(obs[currencyPairKey].v))).toBe(true);
            });
        });
    });

    // Error handling tests
    test('should handle invalid currency pairs gracefully', async () => {
        try {
            const data = await fetchExchangeRates(['CAD', 'ZZZ'], 'recent_weeks=10');
            expect(data.status()).toBe(404); // Ensure status code is 404
            expect(data).toHaveProperty('error');
            expect(data.error).toContain('Invalid currency');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to fetch data');
                expect(error.message).toContain('Status: 404');
            }
        }
    });

    test('should handle invalid query parameters gracefully', async () => {
        try {
            const data = await fetchExchangeRates(['CAD', 'ZZZ'], 'recent_weeks=invalid');
            expect(data).toHaveProperty('error');
            expect(data.error).toContain('Invalid query parameter');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to fetch data');
                expect(error.message).toContain('Status: 400');
            }
        }
    });

    test('should handle HTTP 404 Not Found response', async () => {
        try {
            const response = await fetchExchangeRates(['CAD', 'AUDD'], 'recent_weeks=10');
            expect(response.status()).toBe(404); // Ensure status code is 404
            const responseBody = await response.json();
            expect(responseBody).toHaveProperty('error');
            expect(responseBody.error).toContain('Not Found');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to fetch data');
                expect(error.message).toContain('Status: 404');
            }
        }
    });

    test('should handle HTTP 400 Bad Request for negative values', async () => {
        try {
            const response = await fetchExchangeRates(['CAD', 'AUD'], 'recent_weeks=-1');
            const responseBody = await response.json();
            expect(responseBody).toHaveProperty('error');
            expect(responseBody.error).toContain('Not Found');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to fetch data');
                expect(error.message).toContain('Status: 400');
            }
        }
    });

    test('should handle HTTP 400 Bad Request response', async () => {
        try {
            const response = await fetchExchangeRates(['CAD', 'AUD'], 'bad_request_param');
            expect(response.status()).toBe(400); // Ensure status code is 400
            const responseBody = await response.json();
            expect(responseBody).toHaveProperty('error');
            expect(responseBody.error).toContain('Bad Request');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to fetch data');
                expect(error.message).toContain('Status: 400');
            }
        }
    });
});
