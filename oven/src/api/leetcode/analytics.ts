import type { LeetCodeSubmission, LeetCodeProblem } from '@/api/leetcode';

export interface ProblemStats {
  solved: number;
  byDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  byLanguage: Record<string, number>;
  byTopic: Record<string, number>;
}

export interface SubmissionStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  averageRuntime: Record<string, number>; // by language
  averageMemory: Record<string, number>;  // by language
  submissionsByDate: Record<string, number>;
}

export class AnalyticsService {
  calculateProblemStats(problems: LeetCodeProblem[]): ProblemStats {
    const stats: ProblemStats = {
      solved: problems.length,
      byDifficulty: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      byLanguage: {},
      byTopic: {}
    };

    for (const problem of problems) {
      // Count by difficulty
      stats.byDifficulty[problem.difficulty as keyof typeof stats.byDifficulty]++;

      // Count by topic
      problem.topicTags.forEach(tag => {
        stats.byTopic[tag.name] = (stats.byTopic[tag.name] || 0) + 1;
      });
    }

    return stats;
  }

  calculateSubmissionStats(submissions: LeetCodeSubmission[]): SubmissionStats {
    const stats: SubmissionStats = {
      totalSubmissions: submissions.length,
      acceptedSubmissions: 0,
      averageRuntime: {},
      averageMemory: {},
      submissionsByDate: {}
    };

    // Group submissions by language for runtime/memory analysis
    const byLanguage: Record<string, LeetCodeSubmission[]> = {};

    for (const submission of submissions) {
      // Count accepted submissions
      if (submission.statusDisplay === 'Accepted') {
        stats.acceptedSubmissions++;
      }

      // Group by language
      const lang = submission.lang.toLowerCase();
      byLanguage[lang] = byLanguage[lang] || [];
      byLanguage[lang].push(submission);

      // Track submissions by date
      const date = new Date(submission.timestamp).toISOString().split('T')[0];
      stats.submissionsByDate[date] = (stats.submissionsByDate[date] || 0) + 1;
    }

    // Calculate averages by language
    Object.entries(byLanguage).forEach(([lang, langSubmissions]) => {
      const accepted = langSubmissions.filter(s => s.statusDisplay === 'Accepted');
      if (accepted.length === 0) return;

      stats.averageRuntime[lang] = this.calculateAverage(
        accepted.map(s => parseFloat(s.runtime))
      );
      stats.averageMemory[lang] = this.calculateAverage(
        accepted.map(s => parseFloat(s.memory))
      );
    });

    return stats;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round((sum / numbers.length) * 100) / 100;
  }

  generateMarkdownReport(problemStats: ProblemStats, submissionStats: SubmissionStats): string {
    return `## LeetCode Progress Report 📊

### Problem Solving Progress
- Total Problems Solved: ${problemStats.solved}
- By Difficulty:
  - Easy: ${problemStats.byDifficulty.Easy}
  - Medium: ${problemStats.byDifficulty.Medium}
  - Hard: ${problemStats.byDifficulty.Hard}

### Submission Statistics
- Total Submissions: ${submissionStats.totalSubmissions}
- Acceptance Rate: ${Math.round((submissionStats.acceptedSubmissions / submissionStats.totalSubmissions) * 100)}%

### Language Performance
${Object.entries(submissionStats.averageRuntime)
  .map(([lang, runtime]) => `
#### ${lang}
- Average Runtime: ${runtime}ms
- Average Memory: ${submissionStats.averageMemory[lang]}MB
- Total Solutions: ${problemStats.byLanguage[lang] || 0}`)
  .join('\n')}

### Most Practiced Topics
${Object.entries(problemStats.byTopic)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([topic, count]) => `- ${topic}: ${count} problems`)
  .join('\n')}
`;
  }
}