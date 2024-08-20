import { test, expect, Page } from '@playwright/test';

const TEST_URL = "https://www.amplifonusa.com/";

test.beforeEach(async ({ page }) => {
	await page.goto(TEST_URL);
});
test('Largest Contentful Paint (LCP) test', async ({ page }) => {
    const lcp = await page.evaluate(async () => {
		return new Promise((resolve) => {
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				resolve(entries[ entries.length - 1 ]);
			}).observe({
              type: 'largest-contentful-paint',
              buffered: true
            });
		});
	});

	if (lcp) {
		// Adjust threshold as needed
		expect(lcp.startTime).toBeLessThan(2500);
	}
    page.close();
});

// Test for Time to First Byte (TTFB)
test('Time to First Byte (TTFB) test', async ({ page }) => {
	const ttfb = await page.evaluate(async () => {
		return new Promise((resolve) => {
			window.performance.mark('start');
			resolve(performance.timing.responseStart - performance.timing.requestStart);
		});
	});

	if (ttfb) {
		expect(ttfb).toBeLessThan(800); // Adjust threshold as needed
	}
    page.close();
});

// Test for First Input Delay (FID)
test('First Input Delay (FID) test', async ({ page }) => { 
	// waiting for the page load
	await page.waitForLoadState('load');
	// Simulate a mouse click (adjust the selector as needed) 
	//click on a button with if 'onetrust-accept-btn-handler'
	(await page.waitForSelector('#onetrust-accept-btn-handler')).click();
	
	// Evaluate FID after the interaction
	const fid = await page.evaluate(async () => {
		return new Promise((resolve) => {
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				if (entries.length > 0) {
					resolve(entries[ 0 ]);
				}
			}).observe({
        type: 'first-input',
        buffered: true
      });
		});
	});

	if (fid) {
		expect(fid.processingStart - fid.startTime).toBeLessThan(100); // Adjust threshold as needed
	}
	page.close();
});

test('Cumulative Layout Shift (CLS) test', async ({ page }) => {
	const cls = await page.evaluate(async () => {
		return new Promise((resolve) => {
			let clsValue = 0;
			new PerformanceObserver((entryList) => {
				for (const entry of entryList.getEntries()) {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				}
				resolve(clsValue);
			}).observe({ type: 'layout-shift', buffered: true });
		});
	});

	if (cls) {
		expect(cls).toBeLessThan(0.1);
		// Adjust threshold as needed
	}
	page.close();
});

test('Measure interaction to next paint (INP)', async ({ page }) => {
	async function measureInteractionToPaint(selector) {
		return page.evaluate(async (selector) => {
			return new Promise((resolve) => {
				// Listen for the next paint event
				requestAnimationFrame(() => {
					const startTime = performance.now();

					// Simulate the interaction
					document.querySelector(selector).click();

					requestAnimationFrame(() => {
						const endTime = performance.now();
						resolve(endTime - startTime);
					});
				});
			});
		}, selector);
	}

	// Measure the interaction to paint time for a specific element
	const time = await measureInteractionToPaint('#onetrust-accept-btn-handler');

  // Assertions with expect
	expect(time).toBeLessThan(100);
	page.close();
});