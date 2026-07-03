import { generateInsights } from "@/utils/analytics/generateInsights";

describe("generateInsights()", () => {
  const dummyConsistency = { percentage: 50, currentStreak: 0, totalEntries: 5 };
  const dummyDistribution = [];
  const dummyWeekly = { bestDay: null };

  describe("Trend Insight", () => {
    it("should calculate correct averages when all scores are present", () => {
      // 14 days total:
      // olderHalf: index 0..6: all scores are 5 -> avgOlder = 5
      // recentHalf: index 7..13: all scores are 7 -> avgRecent = 7
      // 7 > 5 + 1 (7 > 6) -> Improving trend expected
      const trends = [
        { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 },
        { score: 7 }, { score: 7 }, { score: 7 }, { score: 7 }, { score: 7 }, { score: 7 }, { score: 7 }
      ];

      const insights = generateInsights({
        trends,
        consistency: dummyConsistency,
        distribution: dummyDistribution,
        weekly: dummyWeekly
      });

      expect(insights).toContain("Your mood has been noticeably improving lately compared to earlier in the period.");
    });

    it("should ignore null/undefined scores instead of treating them as 5", () => {
      // 14 days total:
      // olderHalf: index 0..6 -> one score of 8, rest null -> avgOlder = 8 (previously, (8 + 5*6)/7 = 5.42)
      // recentHalf: index 7..13 -> one score of 8, rest null -> avgRecent = 8 (previously, (8 + 5*6)/7 = 5.42)
      // Since avgRecent (8) === avgOlder (8), it should be stable.
      // If the old code ran: avgRecent (5.42) vs avgOlder (5.42) -> stable.
      // But let's test a case where treating null as 5 would skew and change the outcome:
      // olderHalf: one score of 8, six nulls. Correct average = 8. (Old average = 5.42)
      // recentHalf: one score of 5, six nulls. Correct average = 5. (Old average = 5.0)
      // Correct comparison: 5 vs 8 -> avgRecent < avgOlder - 1 (5 < 7) -> DIPPED trend ("Your mood seems a bit lower recently...")
      // Old comparison: 5.0 vs 5.42 -> difference is 0.42 -> stable trend.
      const trends = [
        { score: 8 }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null },
        { score: 5 }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }
      ];

      const insights = generateInsights({
        trends,
        consistency: dummyConsistency,
        distribution: dummyDistribution,
        weekly: dummyWeekly
      });

      expect(insights).toContain("Your mood seems a bit lower recently. Remember to take time for yourself.");
    });

    it("should handle zero valid scores in a half without division by zero, resulting in null averages", () => {
      // olderHalf: all null -> avgOlder = null
      // recentHalf: all null -> avgRecent = null
      // Should not contain any trend/mood-related comparison statement
      const trends = [
        { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null },
        { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }, { score: null }
      ];

      const insights = generateInsights({
        trends,
        consistency: dummyConsistency,
        distribution: dummyDistribution,
        weekly: dummyWeekly
      });

      // It should not contain any of the trend insights
      expect(insights).not.toContain("Your mood has been noticeably improving lately compared to earlier in the period.");
      expect(insights).not.toContain("Your mood seems a bit lower recently. Remember to take time for yourself.");
      expect(insights).not.toContain("Your overall mood has been relatively stable recently.");
    });
  });
});
