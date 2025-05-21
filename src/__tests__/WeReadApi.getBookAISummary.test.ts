import { WeReadApi } from '../WeReadApi';

describe('WeReadApi.getBookAISummary', () => {
  let api: WeReadApi;
  let makeApiRequestSpy: jest.SpyInstance;
  const originalEnv = process.env; // Store original environment variables

  beforeEach(async () => {
    // Reset modules to ensure clean state for process.env and WeReadApi instantiation
    jest.resetModules();
    // Set the environment variable for the cookie
    process.env = { ...originalEnv, WEREAD_COOKIE: 'testcookie' };

    // Dynamically import WeReadApi *after* setting the environment variable
    // This ensures the module reads the mocked process.env when it first loads.
    const { WeReadApi: WeReadApiModule } = await import('../WeReadApi');
    api = new WeReadApiModule();

    // Spy on makeApiRequest after the instance is created
    makeApiRequestSpy = jest.spyOn(api as any, 'makeApiRequest');
  });

  afterEach(() => {
    // Restore the spy
    if (makeApiRequestSpy) {
      makeApiRequestSpy.mockRestore();
    }
    // Restore original environment variables
    process.env = originalEnv;
  });

  // Test Case 1: Basic Summary Generation
  it('should generate a basic markdown summary', async () => {
    const mockResponse = {
      itemsArray: [
        {
          items: [
            { text: "Chapter 1 Title", level: 1 },
            { text: "Section 1.1", level: 2 },
            { text: "Point 1.1.1", level: 3 },
            { text: "Detail 1.1.1.1", level: 4 }
          ], chapterUid: 1
        },
        {
          items: [
            { text: "Chapter 2 Title", level: 1 }
          ], chapterUid: 2
        }
      ]
    };
    makeApiRequestSpy.mockResolvedValue(mockResponse);
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("# Chapter 1 Title\n## Section 1.1\n- Point 1.1.1\n  - Detail 1.1.1.1\n# Chapter 2 Title\n");
  });

  // Test Case 2: Empty itemsArray
  it('should return "No AI summary available" for empty itemsArray', async () => {
    makeApiRequestSpy.mockResolvedValue({ itemsArray: [] });
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("No AI summary available for this book.");
  });

  // Test Case 3: Empty items in a section
  it('should return an empty string for a section with empty items', async () => {
    makeApiRequestSpy.mockResolvedValue({ itemsArray: [{ items: [], chapterUid: 1 }] });
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("");
  });

  // Test Case 4: Missing itemsArray
  it('should return "No AI summary available" if itemsArray is missing', async () => {
    makeApiRequestSpy.mockResolvedValue({}); // Empty object
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("No AI summary available for this book.");
  });

  // Test Case 5: makeApiRequest throws an error
  it('should return an error message if makeApiRequest throws an error', async () => {
    makeApiRequestSpy.mockRejectedValue(new Error("Network failure"));
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("Error fetching AI summary: Network failure");
  });

  // Test Case 6: Item with missing text or level (graceful skipping)
  it('should gracefully skip items with missing text or level', async () => {
    const mockResponse = {
      itemsArray: [
        {
          items: [
            { level: 1 }, // Missing text
            { text: "Valid Text", level: 2 },
            { text: "Another Text" } // Missing level
          ], chapterUid: 1
        }
      ]
    };
    makeApiRequestSpy.mockResolvedValue(mockResponse);
    const summary = await api.getBookAISummary("testBookId");
    expect(summary).toBe("## Valid Text\n");
  });
});
