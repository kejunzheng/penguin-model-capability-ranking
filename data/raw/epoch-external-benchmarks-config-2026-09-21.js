"use strict";
(() => {
  // legacy/common/formatters.ts
  var monthAbbrevs = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May",
    "Jun.",
    "Jul.",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec."
  ];
  function formatAbbrevMonthDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "Unknown date";
    }
    const month = monthAbbrevs[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  }
  function formatPriceNumber(price) {
    if (Number.isInteger(price)) {
      return price.toLocaleString("en-US");
    }
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
  function formatDurationMinutes(minutes) {
    if (minutes >= 60) {
      const wholeMinutes2 = Math.round(minutes);
      const hours = Math.floor(wholeMinutes2 / 60);
      const remainingMinutes = wholeMinutes2 % 60;
      return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
    }
    const wholeSeconds = Math.round(minutes * 60);
    if (wholeSeconds >= 3600) return "1 hr";
    const wholeMinutes = Math.floor(wholeSeconds / 60);
    const remainingSeconds = wholeSeconds % 60;
    if (wholeMinutes === 0) return `${remainingSeconds} sec`;
    return remainingSeconds === 0 ? `${wholeMinutes} min` : `${wholeMinutes} min ${remainingSeconds} sec`;
  }
  function formatWholeDollars(value) {
    const dollars = Math.round(value);
    return `${dollars < 0 ? "-" : ""}$${Math.abs(dollars).toLocaleString("en-US")}`;
  }
  function formatScoreInUnit(value, unit, decimals = 1) {
    switch (unit) {
      case "minutes":
        return formatDurationMinutes(value);
      case "usd":
        return formatWholeDollars(value);
      case "integer":
        return Math.round(value).toFixed(0);
      case "multiplier":
        return `${value.toFixed(decimals)}x`;
    }
  }

  // legacy/vizs/benchmarks/data/external_benchmarks_config.ts
  var LOG_SCALE = 1;
  function formatCost(value) {
    const cost = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(cost) ? `$${formatPriceNumber(cost)}` : "";
  }
  function formatCount(value) {
    const count = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(count) ? count.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "";
  }
  function formatTooltipDate(value) {
    if (value instanceof Date) return formatAbbrevMonthDate(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatAbbrevMonthDate(new Date(value)) : value;
  }
  var RELEASE_DATE_TOOLTIP_COLUMN = { column: "Version release date", label: "Release date", optional: true, transform: formatTooltipDate };
  function createAnchor(args) {
    const link = Array.isArray(args) ? args[1] : args;
    let label = Array.isArray(args) ? args[0] : "";
    if (!label) label = link;
    return link ? `<a href="${link}" target="_blank">${label}</a>` : label;
  }
  var externalBenchmarkConfigs = {
    aider_polyglot: {
      name: "Aider Polyglot",
      ediName: "Aider polyglot",
      description: "A benchmark measuring models' ability to edit code to solve programming problems in multiple programming languages.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://aider.chat/docs/leaderboards/#polyglot-leaderboard" target="_blank">Aider Polyglot Leaderboard</a>, available under the <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License 2.0</a>.',
      source: "Aider LLM Leaderboard",
      sourceLink: "https://aider.chat/docs/leaderboards/#polyglot-leaderboard",
      modelMapping: {
        nameColumn: "Model",
        identifierColumn: "Model version",
        releaseDateColumn: "Version release date",
        countryColumn: "Country (of organization)",
        accessibilityColumn: "Model accessibility",
        organizationColumn: "Organization",
        trainingComputeColumn: "Training compute (FLOP)"
      },
      accuracy: {
        column: "Percent correct",
        transform: (value) => parseFloat(value) / 100,
        tooltipTransform: (value) => `${parseFloat(value).toFixed(2)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Aider Polyglot accuracy",
        title: "AI performance on code editing tasks in multiple programming languages",
        tooltip: `A benchmark measuring models' ability to edit code to solve programming problems in multiple programming languages. See <a href="https://aider.chat/docs/leaderboards/#polyglot-leaderboard" target="_blank">Aider Leaderboards</a> for more information.`
      },
      tooltipColumns: [
        { column: "Edit format", label: "Edit format" },
        { column: "Percent using correct edit format", label: "Edit format accuracy", transform: (value) => `${value}%` },
        { column: "Cost", label: "Cost", transform: formatCost },
        { column: "Notes", label: "Notes", optional: true },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    weirdml: {
      name: "WeirdML v2",
      ediName: "WeirdML",
      description: "A benchmark evaluating AI models on unusual and challenging Machine Learning tasks, including shape recognition, digit recognition, and chess winner prediction.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://htihle.github.io/weirdml.html" target="_blank">WeirdML Leaderboard</a>.',
      source: "WeirdML Leaderboard",
      sourceLink: "https://htihle.github.io/weirdml.html",
      modelMapping: {
        nameColumn: "Model",
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "Accuracy",
        eciMetric: "Accuracy",
        options: {
          Accuracy: {
            column: "Accuracy",
            label: "Accuracy",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "Cost per run": {
            displayAsAccuracy: false,
            column: "Cost per run",
            label: "Cost per run",
            transform: (value) => parseFloat(value),
            tooltipTransform: formatCost,
            yAxisTickFormat: formatCost
          },
          "Median code length": {
            displayAsAccuracy: false,
            column: "Median code length (lines)",
            label: "Median code length (lines)",
            transform: (value) => parseFloat(value),
            tooltipTransform: formatCount,
            yAxisTickFormat: formatCount
          }
        }
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value)
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "WeirdML average score",
        title: "AI performance on a set of unusual machine learning tasks",
        tooltip: 'A benchmark evaluating AI models on a set of unusual machine learning tasks, including shape recognition, digit recognition, and chess winner prediction. See <a href="https://htihle.github.io/weirdml.html" target="_blank">WeirdML Leaderboard</a> for more information.'
      },
      tooltipColumns: [
        { column: "Date", label: "Date", optional: true, transform: formatTooltipDate },
        {
          column: ["Source", "Source link (site from table)"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    balrog: {
      name: "Balrog Benchmark",
      ediName: "Balrog",
      description: `A benchmark measuring AI agents's progress on a variety of reinforcement learning game environments including <a href="https://www.microsoft.com/en-us/research/project/textworld/" target="_blank">TextWorld</a> and <a href="https://github.com/facebookresearch/nle" target="_blank">NetHack</a>.`,
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://balrogai.com/" target="_blank">Balrog Leaderboard</a>.',
      source: "Balrog Leaderboard",
      sourceLink: "https://balrogai.com/",
      // id,UUID,Model version,Average progress,Average CI radius,BabyAI progress,BabyAI CI radius,Crafter progress,Crafter CI radius,TextWorld progress,TextWorld CI radius,BabaIsAI progress,BabaIsAI CI radius,MiniHack progress,MiniHack CI radius,NetHack progress,NetHack CI radius,Date added,Trajectories,Source,Source link,Notes,id_model_version,Model,Version release date,Hugging Face developer id,Link,Notes_model_version,benchmarks/runs,Display name,Domain,Task,Organization,Authors,Publication date,Reference,Link_model,Citations,Notability criteria,Notability criteria notes,Parameters,Parameters notes,Training compute (FLOP),Training compute notes,Training dataset,Training dataset notes,Training dataset size (datapoints),Dataset size notes,Batch size,Batch size notes,Epochs,Training hardware,Hardware quantity,Abstract,Model accessibility,Hardware utilization,Confidence,Base model,Finetune compute (FLOP),Finetune compute notes,Training code accessibility,Accessibility notes,Training compute cost (2023 USD),Training compute estimation method,Country (of organization)
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "Average progress",
        eciMetric: "Average progress",
        options: {
          "Average progress": {
            column: "Average progress",
            label: "Average progress",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "Average Standard error",
              highColumn: "Average Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "BabyAI progress": {
            column: "BabyAI progress",
            label: "BabyAI progress",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "BabyAI Standard error",
              highColumn: "BabyAI Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "Crafter progress": {
            column: "Crafter progress",
            label: "Crafter progress",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "Crafter Standard error",
              highColumn: "Crafter Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "TextWorld progress": {
            column: "TextWorld progress",
            label: "TextWorld progress",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "TextWorld Standard error",
              highColumn: "TextWorld Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "BabaIsAI progress": {
            column: "BabaIsAI progress",
            label: "BabaIsAI progress",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "BabaIsAI Standard error",
              highColumn: "BabaIsAI Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "MiniHack progress": {
            column: "MiniHack progress",
            label: "MiniHack score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            errorBars: {
              lowColumn: "MiniHack Standard error",
              highColumn: "MiniHack Standard error",
              transform: (value) => parseFloat(value),
              tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
            }
          },
          "NetHack progress": {
            column: "NetHack progress",
            label: "NetHack score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${v.toFixed(1)}%`,
            errorBars: {
              lowColumn: "NetHack Standard error",
              highColumn: "NetHack Standard error",
              transform: (value) => parseFloat(value)
            }
          }
        }
      },
      accuracy: {
        column: "Average progress",
        transform: (value) => parseFloat(value)
      },
      errorBars: {
        lowColumn: "Average Standard error",
        highColumn: "Average Standard error",
        transform: (value) => parseFloat(value)
      },
      displayConfig: {
        yAxisLabel: "Average progress in Balrog environments",
        title: "AI performance on a set of challenging text-based games",
        tooltip: `A benchmark measuring AI agents's progress on a variety of reinforcement learning game environments including <a href="https://www.microsoft.com/en-us/research/project/textworld/" target="_blank">TextWorld</a> and <a href="https://github.com/facebookresearch/nle" target="_blank">NetHack</a>. See <a href="https://balrogai.com/" target="_blank">Balrog Leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        {
          column: "stderr",
          label: "Standard error",
          optional: true,
          transform: (value) => `${Math.round((parseFloat(value) + Number.EPSILON) * 100 * 100) / 100}%`
        },
        { column: "Date", label: "Date", optional: true, transform: formatTooltipDate },
        {
          column: "Trajectories",
          label: "Trajectories",
          optional: true,
          transform: createAnchor
        },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    vpct: {
      name: "VPCT",
      ediName: "VPCT",
      description: "A benchmark evaluating AI models' ability to make predictions about a physics scenario given an image of the initial setup.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://cbrower.dev/vpct" target="_blank">VPCT leaderboard</a>.',
      source: "VPCT leaderboard",
      sourceLink: "https://cbrower.dev/vpct",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Correct",
        transform: (value) => parseFloat(value)
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "VPCT accuracy",
        title: "AI performance on elementary visual physics reasoning problems",
        tooltip: `A benchmark evaluating vision models' ability to make predictions about a physics scenario given an image of the initial setup. See <a href="https://cbrower.dev/vpct" target="_blank">cbrower VPCT leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    fictionlivebench: {
      name: "Fiction.liveBench",
      ediName: "Fiction.LiveBench",
      description: "A benchmark evaluating long-context comprehension of fiction texts.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://fiction.live/stories/Fiction-liveBench-Mar-25-2025/oQdzQvKHw8JyXbN87" target="_blank">Fiction.liveBench Leaderboard</a>',
      source: "Fiction.liveBench Leaderboard",
      sourceLink: "https://fiction.live/stories/Fiction-liveBench-Mar-25-2025/oQdzQvKHw8JyXbN87",
      modelMapping: {
        nameColumn: "Model",
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "16k token score",
        transform: (value) => parseFloat(value)
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "16k token score",
        eciMetric: "16k token score",
        options: {
          "16k token score": {
            column: "16k token score",
            label: "16k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "120k token score": {
            column: "120k token score",
            label: "120k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "60k token score": {
            column: "60k token score",
            label: "60k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "32k token score": {
            column: "32k token score",
            label: "32k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "8k token score": {
            column: "8k token score",
            label: "8k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "4k token score": {
            column: "4k token score",
            label: "4k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "2k token score": {
            column: "2k token score",
            label: "2k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "1k token score": {
            column: "1k token score",
            label: "1k token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "400 token score": {
            column: "400 token score",
            label: "400 token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          },
          "0 token score": {
            column: "0 token score",
            label: "0 token score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
          }
        }
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Fiction.liveBench score",
        title: "AI performance on a set of long-context fiction comprehension questions",
        tooltip: 'A benchmark evaluating long-context comprehension of fiction texts. See <a href="https://fiction.live/stories/Fiction-liveBench-Mar-25-2025/oQdzQvKHw8JyXbN87" target="_blank">Fiction.liveBench Leaderboard</a> for more information.'
      },
      tooltipColumns: [
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    geobench: {
      name: "GeoBench",
      ediName: "GeoBench",
      description: "A benchmark evaluating AI models' ability to geolocate images in the game GeoGuessr.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://geobench.org/" target="_blank">GeoBench leaderboard</a>',
      source: "GeoBench leaderboard",
      sourceLink: "https://geobench.org/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "ACW Country %",
        transform: (value) => parseFloat(value),
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "ACW Country %",
        eciMetric: "ACW Country %",
        options: {
          "ACW Country %": {
            column: "ACW Country %",
            label: "ACW Country %",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
          },
          "AVW Country %": {
            column: "AVW Country %",
            label: "AVW Country %",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
          },
          "Rural Country %": {
            column: "Rural Country %",
            label: "Rural Country %",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
          },
          "Urban Country %": {
            column: "Urban Country %",
            label: "Urban Country %",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
          },
          "Photos Country %": {
            column: "Photos Country %",
            label: "Photos Country %",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`,
            yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
          },
          "ACW Avg Score": {
            displayAsAccuracy: false,
            column: "ACW Avg Score",
            label: "ACW Avg Score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`,
            yAxisTickFormat: (v) => v.toFixed(0)
          },
          "AVW Avg Score": {
            displayAsAccuracy: false,
            column: "AVW Avg Score",
            label: "AVW Avg Score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`,
            yAxisTickFormat: (v) => v.toFixed(0)
          },
          "Rural Avg Score": {
            displayAsAccuracy: false,
            column: "Rural Avg Score",
            label: "Rural Avg Score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`,
            yAxisTickFormat: (v) => v.toFixed(0)
          },
          "Urban Avg Score": {
            displayAsAccuracy: false,
            column: "Urban Avg Score",
            label: "Urban Avg Score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`,
            yAxisTickFormat: (v) => v.toFixed(0)
          },
          "Photos Avg Score": {
            displayAsAccuracy: false,
            column: "Photos Avg Score",
            label: "Photos Avg Score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`,
            yAxisTickFormat: (v) => v.toFixed(0)
          }
        }
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GeoBench country accuracy",
        title: "AI performance on image geolocation tasks in the game GeoGuessr",
        tooltip: `A benchmark evaluating AI models' ability to geolocate images in the game GeoGuessr. See <a href="https://geobench.org/" target="_blank">GeoBench leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        { column: "Tools", label: "Tools", transform: (value) => value ? `${value}` : "None" },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    simplebench: {
      name: "SimpleBench",
      ediName: "SimpleBench",
      description: "A benchmark evaluating AI models' performance on a set of simple reasoning tasks where unspecialized humans (high school level) currently outperform AI.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://simple-bench.com" target="_blank">SimpleBench leaderboard</a>',
      source: "SimpleBench Leaderboard",
      sourceLink: "https://simple-bench.com",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score (AVG@5)",
        transform: (value) => parseFloat(value)
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "SimpleBench average score across 5 runs",
        title: "AI performance on a set of simple reasoning tasks",
        tooltip: `A benchmark evaluating AI models' performance on a set of simple reasoning tasks where unspecialized humans (high school level) currently outperform AI. See <a href="https://simple-bench.com" target="_blank">SimpleBench leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    gdpval: {
      name: "GDPval",
      ediName: "GDPval",
      description: "AI performance on well-specified tasks drawn from selected occupations",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://evals.openai.com/gdpval/leaderboard" target="_blank">GDPval leaderboard</a>.',
      source: "GDPval Leaderboard",
      sourceLink: "https://evals.openai.com/gdpval/leaderboard",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Win Rate (%)",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Win rate",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "win_rate",
        options: {
          win_rate: {
            column: "Win Rate (%)",
            label: "Win rate",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          win_or_tie_rate: {
            column: "Win + tie rate (%)",
            label: "Win + tie rate",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          }
        }
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GDPval win rate",
        title: "AI performance on well-specified occupational tasks",
        tooltip: 'A benchmark measuring model performance on well-specified tasks drawn from selected occupations. See the <a href="https://evals.openai.com/gdpval/leaderboard" target="_blank">GDPval leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    gdp_pdf: {
      name: "GDP.pdf",
      description: "AI performance on real-world professional PDF tasks",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://surgehq.ai/leaderboards/gdp-pdf" target="_blank">Surge AI GDP.pdf leaderboard</a>.',
      source: "Surge AI GDP.pdf leaderboard",
      sourceLink: "https://surgehq.ai/leaderboards/gdp-pdf",
      modelMapping: {
        nameColumn: "Name",
        identifierColumn: "Model version",
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "GDP.pdf score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GDP.pdf score",
        title: "AI performance on professional PDF question-answering tasks",
        tooltip: 'A benchmark testing whether models can answer questions about real-world professional PDFs. See the <a href="https://surgehq.ai/leaderboards/gdp-pdf" target="_blank">Surge AI GDP.pdf leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Provider", label: "Provider", optional: true },
        { column: "Last updated", label: "Leaderboard updated", optional: true },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    metr_time_horizons: {
      name: "METR Time Horizons",
      description: "Duration for humans of software engineering tasks that AI performs with 50% success rate",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://metr.org/time-horizons/" target="_blank">METR Time Horizons leaderboard</a>.',
      source: "METR Time Horizons leaderboard",
      sourceLink: "https://metr.org/time-horizons/",
      displayConfig: {
        yAxisLabel: "Time horizon on METR tasks",
        title: "Duration for humans of software engineering tasks that AI performs with 50% success rate",
        tooltip: "Time horizon is the amount of time it typically takes humans with relevant domain expertise to complete software-related tasks that the AI agents can complete with a 50% success rate.",
        // Scores are minutes; the same formatter prints them on the benchmark and model pages (score_unit: minutes).
        yAxisTickFormat: formatDurationMinutes,
        // The only benchmark plotted on a log y-axis. Time horizons span seconds to hours and
        // carry wide 95% CIs, so on a linear axis the early models collapse onto the x-axis and
        // the top error bars swamp the chart. Screenshot of the linear version:
        // https://github.com/epoch-research/epoch-website-astro/pull/1622#issuecomment-5700344797
        yAxisTicks: [0, 1 / 60, 4 / 60, 0.25, 1, 4, 15, 60, 240],
        yScale: LOG_SCALE
      },
      accuracy: {
        column: "Time horizon",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Time horizon",
        tooltipTransform: (value) => formatDurationMinutes(parseFloat(value))
      },
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      tooltipColumns: [
        {
          column: ["CI_low", "CI_high"],
          label: "95% CI",
          transform: (value) => `${formatDurationMinutes(parseFloat(value[0]))} - ${formatDurationMinutes(parseFloat(value[1]))}`
        },
        { column: "Release date", label: "Release date", optional: true, transform: formatTooltipDate },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      },
      errorBars: {
        lowColumn: "CI_low",
        highColumn: "CI_high",
        transform: (value) => parseFloat(value)
      }
    },
    deepresearchbench: {
      name: "DeepResearchBench",
      ediName: "DeepResearch Bench",
      description: "AI performance on a set of complex multi-step web research tasks",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://drb.futuresearch.ai/" target="_blank">DeepResearchBench leaderboard</a>',
      source: "METR Time Horizons leaderboard",
      sourceLink: "https://drb.futuresearch.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      displayConfig: {
        yAxisLabel: "DeepResearchBench score",
        title: "AI performance on a set of complex multi-step web research tasks",
        tooltip: `A benchmark measuring models' ability to do research on the web. See <a href="https://drb.futuresearch.ai/" target="_blank">FutureSearch Benchmarks</a> for more information.`,
        yAxisTickFormat: (v) => `${v.toFixed(2)}`
      },
      accuracy: {
        column: "Average score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Average score",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(2)}`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      },
      errorBars: null
    },
    terminalbench: {
      name: "Terminal-Bench",
      ediName: "Terminal Bench",
      description: "AI performance on a set of advanced command-line tasks",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.tbench.ai/leaderboard" target="_blank">Terminal-Bench leaderboard</a> available under the <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License 2.0</a>.',
      source: "Terminal-Bench Leaderboard",
      sourceLink: "https://www.tbench.ai/leaderboard",
      displayConfig: {
        yAxisLabel: "Terminal-Bench accuracy",
        title: "AI performance on a set of advanced command-line tasks",
        tooltip: 'A benchmark measuring models\u2019 ability to perform complex tasks on the terminal. See the <a href="https://www.tbench.ai/" target="_blank">Terminal-Bench website</a> for more information.'
      },
      accuracy: {
        column: "Accuracy mean",
        transform: (value) => parseFloat(value),
        tooltipLabel: "pass@1 accuracy"
      },
      tooltipColumns: [
        {
          column: "Accuracy SE",
          label: "Standard error",
          optional: true,
          transform: (value) => `${Math.round((parseFloat(value) + Number.EPSILON) * 100) / 100}%`
        },
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Agent", label: "Agent", optional: true },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [
          "claude-3-7-sonnet-20250219",
          "claude-sonnet-4-20250514",
          "gpt-4.1-2025-04-14",
          "o4-mini-2025-04-16_medium",
          "gemini-2.5-pro-preview-05-06",
          "grok-3-beta"
        ],
        hide: []
      },
      errorBars: null
    },
    posttrainbench: {
      name: "PostTrainBench",
      ediName: "PostTrainBench",
      description: "AI performance on agentic post-training of small base language models",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://posttrainbench.com/" target="_blank">PostTrainBench leaderboard</a>.',
      source: "PostTrainBench Leaderboard",
      sourceLink: "https://posttrainbench.com/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Average (%)",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Average score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "PostTrainBench average score",
        title: "AI performance on post-training small base language models",
        tooltip: 'A benchmark measuring how well agent systems can post-train small base language models under a fixed compute budget. See the <a href="https://posttrainbench.com/" target="_blank">PostTrainBench website</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Scaffold", label: "Scaffold", optional: true },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    gso: {
      name: "GSO",
      ediName: "GSO-Bench",
      description: "A benchmark measuring models' software optimization abilities.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://gso-bench.github.io/" target="_blank">GSO website</a>.',
      source: "GSO Leaderboard",
      sourceLink: "https://gso-bench.github.io/leaderboard.html",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score OPT@1",
        transform: (value) => parseFloat(value),
        tooltipLabel: "OPT@1 score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GSO Opt@1",
        title: "AI performance at improving the runtime performance of 10 popular open-source repositories",
        tooltip: `A benchmark measuring models' software optimization abilities. Opt@1 is the fraction of tasks for which the model's patch passes all unit tests and achieves at least a 95% of the human speedup. See the <a href="https://gso-bench.github.io/" target="_blank">GSO website</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Scaffold", label: "Scaffold", optional: true },
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: false,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [
          "claude-3-7-sonnet-20250219",
          "o4-mini-2025-04-16_high",
          "claude-sonnet-4-20250514",
          "o3-mini-2025-01-31_high",
          "gpt-4o-2024-11-20",
          "claude-3-5-sonnet-20241022",
          "o3-2025-04-16_high"
        ],
        hide: []
      }
    },
    gbaeval: {
      name: "GBAEval",
      ediName: "GBAEval",
      description: "A long-horizon software engineering benchmark where coding agents build a Game Boy Advance emulator from scratch.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://gbaeval.com/leaderboard/" target="_blank">GBAEval leaderboard</a>.',
      source: "GBAEval Leaderboard",
      sourceLink: "https://gbaeval.com/leaderboard/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "overall",
        options: {
          overall: {
            column: "Overall score",
            label: "Overall score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          replay: {
            column: "Replay score",
            label: "Replay score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          procedural: {
            column: "Procedural score",
            label: "Procedural score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          audio: {
            column: "Audio score",
            label: "Audio score",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          }
        }
      },
      accuracy: {
        column: "Overall score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GBAEval overall score",
        title: "AI performance on building a Game Boy Advance emulator from scratch",
        tooltip: 'A long-horizon software engineering benchmark where coding agents build a Game Boy Advance emulator from scratch. See the <a href="https://gbaeval.com/leaderboard/" target="_blank">GBAEval leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Provider", label: "Provider", optional: true },
        { column: "GBAEval model id", label: "GBAEval model id", optional: true },
        { column: "Graded at", label: "Graded at", optional: true },
        { column: "Tokens used", label: "Tokens used", optional: true, transform: formatCount },
        { column: "Wall-clock hours", label: "Wall-clock hours", optional: true, transform: (value) => parseFloat(value).toFixed(1) },
        { column: "Checkpoints", label: "Checkpoints", optional: true },
        { column: "Has WASM", label: "Has WASM", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    frontierswe: {
      name: "FrontierSWE v2",
      ediName: "FrontierSWE",
      description: "An ultra-long-horizon software engineering benchmark for coding agents across implementation, performance, and research tasks.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.frontierswe.com/" target="_blank">FrontierSWE leaderboard</a>.',
      source: "FrontierSWE Leaderboard",
      sourceLink: "https://www.frontierswe.com/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score (mean@5)",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "FrontierSWE score",
        title: "AI performance on ultra-long-horizon software engineering tasks",
        tooltip: 'FrontierSWE v2 evaluates coding agents on 34 ultra-long-horizon tasks (implementation, performance engineering, scientific computing, visual reasoning and AI research) with a 20-hour budget per task. Every task is scored from 0 to 100%; the score shown is the mean over 5 trials per task, averaged across tasks. See the <a href="https://www.frontierswe.com/" target="_blank">FrontierSWE leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Harness", label: "Harness", optional: true },
        { column: "Best@5", label: "Best of 5 trials", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Worst@5", label: "Worst of 5 trials", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Implementation", label: "Implementation tasks", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Performance", label: "Performance tasks", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Research", label: "Research tasks", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Average cost (USD)", label: "Average cost per task", optional: true, transform: formatCost },
        { column: "Average duration (hours)", label: "Average time per task", optional: true, transform: (value) => value ? `${parseFloat(value).toFixed(1)} h` : "" },
        { column: "Aggregation", label: "Aggregation", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    frontiercode: {
      name: "FrontierCode",
      ediName: "FrontierCode",
      description: "A benchmark testing whether coding agents can produce mergeable fixes for real, hard open-source issues.",
      note: `The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from <a href="https://cognition.com/frontiercode" target="_blank">Cognition's FrontierCode leaderboard</a>.`,
      source: "Cognition FrontierCode",
      sourceLink: "https://cognition.com/frontiercode",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Main score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Main score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "FrontierCode 1.1 Main score",
        title: "AI ability to produce mergeable fixes for hard open-source issues",
        tooltip: `FrontierCode grades whether a coding agent's patch on a real open-source issue is mergeable. The FrontierCode 1.1 Main score is the rubric score on the 100-task Main subset at each model's best reasoning effort. See <a href="https://cognition.com/frontiercode" target="_blank">Cognition's FrontierCode leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Harness", label: "Harness", optional: true },
        { column: "Reasoning effort", label: "Reasoning effort", optional: true },
        { column: "Aggregation", label: "Aggregation", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    cursorbench: {
      name: "CursorBench",
      ediName: "CursorBench",
      description: "A benchmark scoring coding agents on ambiguous, multi-file tasks drawn from real Cursor sessions.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://cursor.com/cursorbench" target="_blank">CursorBench leaderboard</a>.',
      source: "CursorBench leaderboard",
      sourceLink: "https://cursor.com/cursorbench",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "CursorBench score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CursorBench score",
        title: "AI performance on real-world multi-file coding tasks",
        tooltip: 'CursorBench evaluates coding agents on ambiguous, multi-file tasks drawn from real Cursor sessions. Higher scores are better. See the <a href="https://cursor.com/cursorbench" target="_blank">CursorBench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Reasoning level", label: "Reasoning level", optional: true },
        { column: "Cost per task", label: "Cost per task", optional: true, transform: formatCost },
        { column: "Tokens per task", label: "Tokens per task", optional: true, transform: formatCount },
        { column: "Steps per task", label: "Steps per task", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    scicode: {
      name: "SciCode",
      ediName: "SciCode",
      description: "A scientist-curated benchmark of research-coding problems from across the natural sciences.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://artificialanalysis.ai/evaluations/scicode" target="_blank">Artificial Analysis SciCode leaderboard</a>.',
      source: "Artificial Analysis SciCode leaderboard",
      sourceLink: "https://artificialanalysis.ai/evaluations/scicode",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "SciCode accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "SciCode accuracy",
        title: "AI performance on scientific research-coding problems",
        tooltip: 'SciCode measures whether models can turn scientific knowledge into working code, scored as the share of subproblems whose generated code passes the tests. Scores are measured by Artificial Analysis. See the <a href="https://artificialanalysis.ai/evaluations/scicode" target="_blank">Artificial Analysis SciCode leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Provider", label: "Provider", optional: true },
        { column: "AA model slug", label: "AA model ID", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    webdev_arena: {
      name: "Text Arena (Coding)",
      description: "An arena where models compete head-to-head by building web applications based on user requests, with winners determined by user preference. Previously known as WebDev Arena, now a coding subset of LMArena's Text Arena.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://arena.ai/leaderboard/text/coding" target="_blank">Text Arena (Coding) leaderboard</a>.',
      source: "Text Arena (Coding) Leaderboard",
      sourceLink: "https://arena.ai/leaderboard/text/coding",
      modelMapping: {
        nameColumn: "Model",
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Arena Score",
        transform: (value) => parseFloat(value),
        tooltipTransform: (value) => value,
        tooltipLabel: "Arena Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Text Arena (Coding) score",
        title: "AI ability to build user-specified web applications",
        tooltip: 'An arena where models compete head-to-head by building web applications based on user requests, with winners determined by user preference. See the <a href="https://arena.ai/leaderboard/text/coding" target="_blank">Text Arena (Coding) leaderboard</a> for more information.',
        yAxisTickFormat: (v) => formatScoreInUnit(v, "integer")
      },
      tooltipColumns: [
        { column: "Score 95% CI", label: "95% CI", optional: true },
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Agent", label: "Agent", optional: true },
        { column: "Votes", label: "Votes", optional: true, transform: formatCount },
        {
          column: ["Source", "Source link (site from table)"],
          label: "Source",
          optional: false,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    adversarial_nli: {
      name: "Adversarial NLI",
      ediName: "ANLI",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Adversarial NLI score",
        title: "Adversarial NLI",
        tooltip: 'See the <a href="http://arxiv.org/abs/2404.14219" target="_blank">Adversarial NLI paper</a> for more information.'
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: true,
          transform: createAnchor
        }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    arc_agi: {
      name: "ARC-AGI-1",
      ediName: "ARC-AGI",
      description: "",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://arcprize.org/leaderboard" target="_blank">ARC Prize leaderboard</a>.',
      source: "ARC Prize Leaderboard",
      sourceLink: "https://arcprize.org/leaderboard",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ARC-AGI-1 score",
        title: "ARC-AGI-1",
        tooltip: ""
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source link", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    arc_ai2: {
      name: "ARC AI2",
      ediName: "ARC AI2",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Challenge score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Challenge score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ARC AI2 score",
        title: "ARC AI2",
        tooltip: ""
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source link", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    bbh: {
      name: "BBH",
      ediName: "BBH",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Average",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Average"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "BBH score",
        title: "BBH",
        tooltip: ""
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source link", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    bool_q: {
      name: "BoolQ",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "BoolQ score",
        title: "BoolQ",
        tooltip: ""
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    cad_eval: {
      name: "CadEval",
      ediName: "CadEval",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Overall pass (%)",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall pass (%)"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CadEval score",
        title: "CadEval",
        tooltip: "A text-to-CAD benchmark evaluating whether models can generate valid parametric 3D designs."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    common_sense_qa_2: {
      name: "CommonSenseQA 2",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CommonSenseQA 2 score",
        title: "CommonSenseQA 2",
        tooltip: "A harder, bias-reduced multiple-choice benchmark that probes everyday commonsense beyond lexical shortcuts."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    cybench: {
      name: "Cybench",
      ediName: "Cybench",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Unguided % Solved",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Unguided % Solved"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Cybench score",
        title: "Cybench",
        tooltip: "A cybersecurity agent benchmark measuring autonomous vulnerability discovery and exploitation across sandboxed challenges."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    gsm8k: {
      name: "GSM8K",
      ediName: "GSM8K",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "EM",
        transform: (value) => parseFloat(value),
        tooltipLabel: "EM"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "GSM8K score",
        title: "GSM8K",
        tooltip: "A grade-school math word problem benchmark focused on multi-step arithmetic reasoning."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    hella_swag: {
      name: "HellaSwag",
      ediName: "HellaSwag",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Overall accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall accuracy"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "HellaSwag score",
        title: "HellaSwag",
        tooltip: "An adversarially filtered commonsense sentence-completion benchmark measuring plausibility in everyday scenarios."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source link", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    lambada: {
      name: "LAMBADA",
      ediName: "LAMBADA",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "LAMBADA score",
        title: "LAMBADA",
        tooltip: "A long-context language modeling benchmark where the final word of a passage must be predicted from broader discourse."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source link", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    lech_mazur_writing: {
      name: "Lech Mazur Writing",
      ediName: "Lech Mazur Writing",
      ediDisplayScale: 10,
      // Data is in 0-10 range, EDI curve outputs 0-1, Python scales by 1/10
      description: "",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://github.com/lechmazur/Writing" target="_blank">Lech Mazur Writing leaderboard</a>.',
      source: "Lech Mazur Writing Leaderboard",
      sourceLink: "https://github.com/lechmazur/Writing",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Mean score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Mean score",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(2)}`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Lech Mazur Writing score",
        title: "Lech Mazur Writing",
        tooltip: "A writing-quality benchmark that scores models on multi-genre composition using a standardized rubric.",
        yAxisTickFormat: (v) => `${v.toFixed(1)}`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    live_bench: {
      name: "LiveBench",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Global average",
        transform: (value) => parseFloat(value) / 100,
        tooltipLabel: "Global average"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "LiveBench score",
        title: "LiveBench",
        tooltip: "A dynamic, broad-coverage benchmark of real-world tasks updated in periodic releases."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    mmlu: {
      name: "MMLU",
      ediName: "MMLU",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "EM",
        transform: (value) => parseFloat(value),
        tooltipLabel: "EM"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "MMLU score",
        title: "MMLU",
        tooltip: "A multi-task exam-style benchmark covering dozens of academic and professional subjects."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    open_book_qa: {
      name: "OpenBookQA",
      ediName: "OpenBookQA",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "OpenBookQA score",
        title: "OpenBookQA",
        tooltip: "A small open-book science QA benchmark requiring the combination of a core fact with additional commonsense."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    osworld_2: {
      name: "OSWorld 2.0",
      ediName: "OSWorld 2.0",
      description: "A computer-use agent benchmark of 108 long-horizon, real-world desktop and web tasks.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://osworld-v2.xlang.ai/" target="_blank">OSWorld 2.0 leaderboard</a>.',
      source: "OSWorld 2.0 leaderboard",
      sourceLink: "https://osworld-v2.xlang.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Binary accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Binary accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "OSWorld 2.0 binary accuracy",
        title: "AI performance on long-horizon computer-use tasks",
        tooltip: `OSWorld 2.0 evaluates computer-use agents on 108 long-horizon desktop and web tasks. Binary accuracy is the share of tasks an agent completes in full (all scoring checkpoints pass), at the leaderboard's default 500-step budget. See the <a href="https://osworld-v2.xlang.ai/" target="_blank">OSWorld 2.0 leaderboard</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Partial score", label: "Partial score", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Reasoning", label: "Reasoning", optional: true },
        { column: "Tool setting", label: "Tool setting", optional: true },
        { column: "Step budget", label: "Step budget", optional: true },
        { column: "Estimated cost (USD)", label: "Estimated cost", optional: true, transform: formatCost },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    os_world: {
      name: "OS World",
      ediName: "OSWorld",
      description: "A benchmark evaluating AI agents on operating system navigation and task completion in a simulated OS environment",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://os-world.github.io/" target="_blank">OS World Website</a>.',
      source: "OS World Website",
      sourceLink: "https://os-world.github.io/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value) / 100,
        tooltipLabel: "Score",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "OS World score",
        title: "OS World",
        tooltip: "A computer-use benchmark where agents complete desktop or web tasks using only pixel/screenshot observations."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    piqa: {
      name: "PIQA",
      ediName: "PIQA",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "PIQA score",
        title: "PIQA",
        tooltip: "A physical commonsense benchmark where models choose the more feasible solution to everyday problems."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    science_qa: {
      name: "ScienceQA",
      ediName: "ScienceQA",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ScienceQA score",
        title: "ScienceQA",
        tooltip: "A multimodal multiple-choice science benchmark combining text, images, and diagrams with rich rationales."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    superglue: {
      name: "SuperGLUE",
      ediName: "SuperGLUE",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "SuperGLUE score",
        title: "SuperGLUE",
        tooltip: "A suite of diverse language understanding tasks designed to be more challenging than GLUE."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    the_agent_company: {
      name: "The Agent Company",
      ediName: "The Agent Company",
      description: "",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://the-agent-company.com/#/leaderboard" target="_blank">The Agent Company leaderboard</a>.',
      source: "The Agent Company Leaderboard",
      sourceLink: "https://the-agent-company.com/#/leaderboard",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "% Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "% Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "The Agent Company score",
        title: "The Agent Company",
        tooltip: "A community-run evaluation of end-to-end software agents that attempt realistic tasks in reproducible environments."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    video_mme: {
      name: "Video-MME",
      description: "A benchmark evaluating multimodal models on video question answering across short, medium, and long clips, with and without subtitles.",
      category: "Multimodal",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the official <a href="https://video-mme.github.io/home_page.html#leaderboard" target="_blank">Video-MME leaderboard</a>.',
      source: "Video-MME Leaderboard",
      sourceLink: "https://video-mme.github.io/home_page.html#leaderboard",
      modelMapping: {
        nameColumn: "Name",
        identifierColumn: "Model version",
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "Overall (no subtitles)",
        eciMetric: "Overall (no subtitles)",
        options: {
          "Overall (no subtitles)": {
            column: "Overall (no subtitles)",
            label: "Overall (no subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Overall (with subtitles)": {
            column: "Overall (with subtitles)",
            label: "Overall (with subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Short videos (no subtitles)": {
            column: "Short videos (no subtitles)",
            label: "Short videos (no subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Short videos (with subtitles)": {
            column: "Short videos (with subtitles)",
            label: "Short videos (with subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Medium videos (no subtitles)": {
            column: "Medium videos (no subtitles)",
            label: "Medium videos (no subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Medium videos (with subtitles)": {
            column: "Medium videos (with subtitles)",
            label: "Medium videos (with subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Long videos (no subtitles)": {
            column: "Long videos (no subtitles)",
            label: "Long videos (no subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Long videos (with subtitles)": {
            column: "Long videos (with subtitles)",
            label: "Long videos (with subtitles)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          }
        }
      },
      accuracy: {
        column: "Overall (no subtitles)",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall accuracy (no subtitles)",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Video-MME accuracy",
        title: "AI performance on long-form video understanding",
        tooltip: "A benchmark of 900 video question-answer pairs spanning short clips to hour-long videos, reported with and without subtitles. Scores are sourced from the official Video-MME leaderboard.",
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Frames", label: "Frames used", optional: true },
        { column: "Notes", label: "Notes", optional: true },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    trivia_qa: {
      name: "TriviaQA",
      ediName: "TriviaQA",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "EM",
        transform: (value) => parseFloat(value),
        tooltipLabel: "EM"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "TriviaQA score",
        title: "TriviaQA",
        tooltip: "An open-domain question answering benchmark with challenging trivia questions paired with evidence documents."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    wino_grande: {
      name: "WinoGrande",
      ediName: "Winogrande",
      description: "",
      note: "",
      source: "",
      sourceLink: "",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "WinoGrande score",
        title: "WinoGrande",
        tooltip: "A large-scale pronoun resolution and coreference benchmark designed to reduce annotation artifacts."
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    apex_agents: {
      name: "APEX-Agents",
      ediName: "APEX-Agents",
      description: "A benchmark evaluating whether AI models can perform economically valuable knowledge work across investment banking, management consulting, law, and primary medical care.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.mercor.com/apex/" target="_blank">APEX leaderboard</a>.',
      source: "APEX Leaderboard",
      sourceLink: "https://www.mercor.com/apex/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Pass@1 score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Pass@1 score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "APEX-Agents Pass@1 score",
        title: "AI performance on professional knowledge work tasks",
        tooltip: 'A benchmark evaluating whether AI models can perform economically valuable knowledge work across investment banking, management consulting, law, and primary medical care. See the <a href="https://www.mercor.com/apex/" target="_blank">APEX website</a> for more information.'
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: true,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    arc_agi_2: {
      name: "ARC-AGI-2",
      ediName: "ARC-AGI-2",
      description: "A harder successor to ARC-AGI that tests few-shot abstract reasoning and pattern generalization on grid-based tasks, with an added emphasis on efficiency of compute per task solved.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://arcprize.org/leaderboard" target="_blank">ARC Prize leaderboard</a>.',
      source: "ARC Prize Leaderboard",
      sourceLink: "https://arcprize.org/leaderboard",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Score"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ARC-AGI-2 score",
        title: "AI performance on abstract reasoning and pattern generalization tasks",
        tooltip: 'A harder successor to ARC-AGI that tests few-shot abstract reasoning and pattern generalization on grid-based tasks. See the <a href="https://arcprize.org/leaderboard" target="_blank">ARC Prize leaderboard</a> for more information.'
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: true,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    hle: {
      name: "Humanity's Last Exam",
      ediName: "HLE",
      description: "A set of 2,500 expert-authored questions spanning over 100 academic subjects, designed to test the limits of frontier AI models on problems that require deep, specialized knowledge.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://scale.com/leaderboard/humanitys_last_exam" target="_blank">HLE leaderboard</a>.',
      source: "HLE Leaderboard",
      sourceLink: "https://scale.com/leaderboard/humanitys_last_exam",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy"
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Humanity's Last Exam accuracy",
        title: "AI performance on expert-level questions across 100+ academic subjects",
        tooltip: 'A set of 2,500 expert-authored questions spanning over 100 academic subjects, designed to test the limits of frontier AI models. See the <a href="https://scale.com/leaderboard/humanitys_last_exam" target="_blank">HLE leaderboard</a> for more information.'
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        {
          column: ["Source", "Source link"],
          label: "Source",
          optional: true,
          transform: createAnchor
        },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    exploitbench: {
      name: "ExploitBench",
      ediName: "ExploitBench",
      description: 'A benchmark measuring how far LLM agents can climb a "capability ladder" of software exploitation against real, hardened security vulnerabilities.',
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://exploitbench.ai/" target="_blank">ExploitBench leaderboard</a>.',
      source: "ExploitBench leaderboard",
      sourceLink: "https://exploitbench.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Mean capability",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Mean capability",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ExploitBench mean capability",
        title: "AI performance on real-world software exploitation tasks",
        tooltip: 'A benchmark measuring how far LLM agents can progress through tiered software exploitation tasks against real, hardened vulnerabilities. See the <a href="https://exploitbench.ai/" target="_blank">ExploitBench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Mean", label: "Mean flags lit (0\u201316)", optional: true },
        { column: "Spend", label: "Spend", optional: true, transform: formatCost },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    cl_bench: {
      name: "CL-bench",
      ediName: "CL-bench",
      description: "A benchmark testing whether models can learn genuinely new knowledge from context at inference time and then apply it to expert-designed tasks.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.clbench.com/" target="_blank">CL-bench leaderboard</a>.',
      source: "CL-bench leaderboard",
      sourceLink: "https://www.clbench.com/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Category",
        defaultMetric: "Overall",
        options: {
          Overall: {
            column: "Overall",
            label: "Overall",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Domain knowledge reasoning": {
            column: "Domain knowledge reasoning score",
            label: "Domain knowledge reasoning",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Rule system application": {
            column: "Rule system application score",
            label: "Rule system application",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Procedural task execution": {
            column: "Procedural task execution score",
            label: "Procedural task execution",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Empirical discovery & simulation": {
            column: "Empirical discovery & simulation score",
            label: "Empirical discovery & simulation",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          }
        }
      },
      accuracy: {
        column: "Overall",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CL-bench solving rate",
        title: "AI performance on learning and applying new knowledge from context",
        tooltip: 'A benchmark testing whether models can learn new knowledge from context and apply it to expert-designed tasks. See the <a href="https://www.clbench.com/" target="_blank">CL-bench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    cl_bench_life: {
      name: "CL-bench Life",
      ediName: "CL-bench Life",
      description: "A companion to CL-bench testing whether models can learn from and reason over messy, real-life context such as everyday communication, scattered notes, and behavioral traces.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.clbench.com/" target="_blank">CL-bench Life leaderboard</a>.',
      source: "CL-bench Life leaderboard",
      sourceLink: "https://www.clbench.com/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Category",
        defaultMetric: "Overall",
        options: {
          Overall: {
            column: "Overall",
            label: "Overall",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Communication & social interactions": {
            column: "Communication & social interactions score",
            label: "Communication & social interactions",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Fragmented information & revisions": {
            column: "Fragmented information & revisions score",
            label: "Fragmented information & revisions",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          },
          "Behavioral records & activity trails": {
            column: "Behavioral records & activity trails score",
            label: "Behavioral records & activity trails",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
          }
        }
      },
      accuracy: {
        column: "Overall",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CL-bench Life solving rate",
        title: "AI performance on learning from messy, real-life context",
        tooltip: 'A benchmark testing whether models can learn from and reason over messy, real-life context. See the <a href="https://www.clbench.com/" target="_blank">CL-bench Life leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    rli: {
      name: "Remote Labor Index",
      ediName: "Remote Labor Index",
      description: "A benchmark measuring how well AI agents can complete real, economically valuable remote freelance projects end-to-end.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.remotelabor.ai/" target="_blank">Remote Labor Index leaderboard</a>.',
      source: "Remote Labor Index leaderboard",
      sourceLink: "https://www.remotelabor.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Automation rate",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Remote Labor Index automation rate",
        title: "AI performance on real-world remote freelance work",
        tooltip: 'A benchmark measuring how well AI agents can complete real, paid remote freelance projects to a professional standard. See the <a href="https://www.remotelabor.ai/" target="_blank">Remote Labor Index leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Notes", label: "Notes", optional: true },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    algotune: {
      name: "AlgoTune",
      ediName: "AlgoTune",
      description: "A benchmark testing whether language models can write code that runs faster than expert reference implementations while remaining correct.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://algotune.io/" target="_blank">AlgoTune leaderboard</a>.',
      source: "AlgoTune leaderboard",
      sourceLink: "https://algotune.io/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Speedup",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(2)}x`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "AlgoTune speedup",
        title: "AI ability to optimize numerical code for speed",
        tooltip: 'A benchmark measuring whether models can speed up numerical programs relative to expert reference implementations while keeping outputs correct. See the <a href="https://algotune.io/" target="_blank">AlgoTune leaderboard</a> for more information.',
        yAxisTickFormat: (v) => formatScoreInUnit(v, "multiplier")
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Notes", label: "Notes", optional: true },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    ale_bench: {
      name: "ALE-Bench",
      ediName: "ALE-Bench",
      description: "A benchmark evaluating AI on long-horizon, objective-driven algorithm engineering using hard combinatorial optimization problems from competitive programming contests.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://sakanaai.github.io/ALE-Bench-Leaderboard/" target="_blank">ALE-Bench leaderboard</a>.',
      source: "ALE-Bench leaderboard",
      sourceLink: "https://sakanaai.github.io/ALE-Bench-Leaderboard/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Metric",
        defaultMetric: "Performance",
        options: {
          Performance: {
            column: "Performance",
            label: "Performance",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`
          },
          Rank: {
            displayAsAccuracy: false,
            column: "Rank",
            label: "Rank (lower is better)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`
          }
        }
      },
      accuracy: {
        column: "Performance",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Performance",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(0)}`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ALE-Bench performance",
        title: "AI performance on long-horizon algorithm engineering contests",
        tooltip: 'A benchmark measuring AI ability to iteratively engineer solutions to hard combinatorial optimization problems, scored against human contestants. See the <a href="https://sakanaai.github.io/ALE-Bench-Leaderboard/" target="_blank">ALE-Bench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => formatScoreInUnit(v, "integer")
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Rank", label: "Rank", optional: true },
        { column: "Cost", label: "Cost", optional: true, transform: formatCost },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    forecastbench: {
      name: "ForecastBench",
      ediName: "ForecastBench",
      description: "A dynamic, continuously updated benchmark of AI forecasting ability on real-world future events, with direct comparison to human superforecasters and the general public.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.forecastbench.org/leaderboards/" target="_blank">ForecastBench leaderboard</a>.',
      source: "ForecastBench leaderboard",
      sourceLink: "https://www.forecastbench.org/leaderboards/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      metrics: {
        dropdownLabel: "Question type",
        defaultMetric: "Overall",
        options: {
          Overall: {
            displayAsAccuracy: false,
            column: "Overall score",
            label: "Overall (higher is better)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(3)}`
          },
          Dataset: {
            displayAsAccuracy: false,
            column: "Dataset score",
            label: "Dataset (higher is better)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(3)}`
          },
          Market: {
            displayAsAccuracy: false,
            column: "Market score",
            label: "Market (higher is better)",
            transform: (value) => parseFloat(value),
            tooltipTransform: (value) => `${parseFloat(value).toFixed(3)}`
          }
        }
      },
      accuracy: {
        column: "Overall score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Difficulty-adjusted Brier Index",
        tooltipTransform: (value) => `${parseFloat(value).toFixed(3)}`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ForecastBench Brier Index (higher is better)",
        title: "AI forecasting accuracy on real-world future events",
        tooltip: 'A benchmark measuring how well AI can forecast real-world future events, scored with a difficulty-adjusted Brier Index where higher is better. See the <a href="https://www.forecastbench.org/leaderboards/" target="_blank">ForecastBench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${v.toFixed(2)}`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Notes", label: "Notes", optional: true },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    critpt: {
      name: "CritPt",
      ediName: "CritPt",
      description: "A benchmark testing whether AI can reason through complex, open-ended, research-level physics problems modeled on entry-level original research projects.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://artificialanalysis.ai/evaluations/critpt" target="_blank">CritPt leaderboard</a>.',
      source: "CritPt leaderboard",
      sourceLink: "https://artificialanalysis.ai/evaluations/critpt",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "CritPt accuracy",
        title: "AI performance on research-level physics problems",
        tooltip: 'A benchmark testing whether AI can solve unpublished, research-level physics challenges across modern subfields. See the <a href="https://artificialanalysis.ai/evaluations/critpt" target="_blank">CritPt leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Cost", label: "Cost", optional: true, transform: formatCost },
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    vending_bench_2: {
      name: "Vending-Bench 2",
      ediName: "Vending-Bench 2",
      description: "A benchmark measuring an AI agent's ability to stay coherent and run a simulated vending machine business profitably over a full simulated year.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://andonlabs.com/evals/vending-bench-2" target="_blank">Vending-Bench 2 leaderboard</a>.',
      source: "Vending-Bench 2 leaderboard",
      sourceLink: "https://andonlabs.com/evals/vending-bench-2",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Net worth",
        tooltipTransform: (value) => formatWholeDollars(parseFloat(value))
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Vending-Bench 2 net worth (USD)",
        title: "AI ability to run a business over a long horizon",
        tooltip: 'A benchmark in which an AI agent autonomously operates a simulated vending machine business for a year, scored by its end-of-year money balance. See the <a href="https://andonlabs.com/evals/vending-bench-2" target="_blank">Vending-Bench 2 leaderboard</a> for more information.',
        yAxisTickFormat: formatWholeDollars
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: ["Source", "Source link"], label: "Source", optional: true, transform: createAnchor }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    surface_evolver_bench: {
      name: "Surface Evolver Bench",
      ediName: "Surface Evolver Bench",
      description: "An agentic benchmark testing whether LLMs can write Surface Evolver simulations of liquid surfaces shaped by surface tension.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://yhenon.github.io/surface-evolver-llm-eval/" target="_blank">Surface Evolver Bench leaderboard</a>.',
      source: "Surface Evolver Bench leaderboard",
      sourceLink: "https://yhenon.github.io/surface-evolver-llm-eval/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Mean score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Mean score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Surface Evolver Bench mean score",
        title: "AI ability to write liquid-surface physics simulations",
        tooltip: 'Surface Evolver Bench has LLM agents write Surface Evolver simulations of liquid surfaces shaped by surface tension, graded with partial credit against hidden reference checks. See the <a href="https://yhenon.github.io/surface-evolver-llm-eval/" target="_blank">Surface Evolver Bench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Pass rate", label: "Pass rate", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Provider", label: "Provider", optional: true },
        { column: "Total cost (USD)", label: "Total cost", optional: true, transform: formatCost },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    deepswe: {
      name: "DeepSWE",
      ediName: "DeepSWE",
      description: "A benchmark of original, long-horizon software engineering tasks written from scratch across active open-source repositories.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://deepswe.datacurve.ai/" target="_blank">DeepSWE leaderboard</a>.',
      source: "DeepSWE leaderboard",
      sourceLink: "https://deepswe.datacurve.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Pass@1",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Pass@1",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "DeepSWE pass@1",
        title: "AI performance on original long-horizon software engineering tasks",
        tooltip: 'DeepSWE evaluates coding agents on original, long-horizon software engineering tasks graded by hand-written program-based verifiers. Pass@1 is the share of rollout attempts that pass. See the <a href="https://deepswe.datacurve.ai/" target="_blank">DeepSWE leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Pass@4", label: "Pass@4", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Harness", label: "Harness", optional: true },
        { column: "Reasoning effort", label: "Reasoning effort", optional: true },
        { column: "Mean cost (USD)", label: "Mean cost", optional: true, transform: formatCost },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    blueprint_bench_2: {
      name: "Blueprint-Bench 2",
      ediName: "Blueprint-Bench 2",
      description: "A spatial-intelligence benchmark where AI agents convert apartment photographs into 2D floor plans.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://andonlabs.com/evals/blueprint-bench-2" target="_blank">Blueprint-Bench 2 leaderboard</a>.',
      source: "Blueprint-Bench 2 leaderboard",
      sourceLink: "https://andonlabs.com/evals/blueprint-bench-2",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Normalized score",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "Blueprint-Bench 2 normalized score",
        title: "AI ability to build floor plans from apartment photos",
        tooltip: 'Blueprint-Bench 2 has AI agents convert apartment photographs into 2D floor plans, scored by comparing room-connectivity graphs to ground truth and normalized so 0 is the random baseline. See the <a href="https://andonlabs.com/evals/blueprint-bench-2" target="_blank">Blueprint-Bench 2 leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Raw score", label: "Raw score", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Raw score standard error", label: "Raw score SE", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    mindcube: {
      name: "MindCube",
      ediName: "MindCube",
      description: "A benchmark testing whether vision-language models can build spatial mental models of scenes from limited camera views.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://mind-cube.github.io/" target="_blank">MindCube leaderboard</a>.',
      source: "MindCube leaderboard",
      sourceLink: "https://mind-cube.github.io/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Overall score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "MindCube overall accuracy",
        title: "AI ability to build spatial mental models from limited views",
        tooltip: 'MindCube tests whether vision-language models can infer positions, orientations, and unseen parts of a scene from limited camera views. See the <a href="https://mind-cube.github.io/" target="_blank">MindCube leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Rotation score", label: "Rotation", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Among score", label: "Among", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Around score", label: "Around", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Group", label: "Group", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    spatialviz_bench: {
      name: "SpatialViz-Bench",
      ediName: "SpatialViz-Bench",
      description: "A benchmark of programmatically generated spatial visualization puzzles for multimodal models.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://arxiv.org/abs/2507.07610" target="_blank">SpatialViz-Bench paper</a> (with-CoT setting).',
      source: "SpatialViz-Bench paper (Table 2)",
      sourceLink: "https://arxiv.org/abs/2507.07610",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Overall score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Overall accuracy (w/ CoT)",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "SpatialViz-Bench accuracy (w/ CoT)",
        title: "AI performance on spatial visualization puzzles",
        tooltip: 'SpatialViz-Bench measures spatial visualization in multimodal models with programmatically generated puzzles across mental rotation, folding, penetration, and animation, scored with chain-of-thought prompting. See the <a href="https://arxiv.org/abs/2507.07610" target="_blank">SpatialViz-Bench paper</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Mental Rotation score", label: "Mental Rotation", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Mental Folding score", label: "Mental Folding", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Visual Penetration score", label: "Visual Penetration", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Mental Animation score", label: "Mental Animation", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    proofbench: {
      name: "ProofBench",
      ediName: "ProofBench",
      description: "A benchmark of graduate-level mathematics problems where models must write Lean 4 proofs that pass formal verification.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://www.vals.ai/benchmarks/proof_bench" target="_blank">Vals AI ProofBench leaderboard</a>.',
      source: "Vals AI ProofBench leaderboard",
      sourceLink: "https://www.vals.ai/benchmarks/proof_bench",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Proof success rate",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "ProofBench proof success rate",
        title: "AI ability to write formally verified mathematical proofs",
        tooltip: 'ProofBench measures whether models can write Lean 4 proofs of graduate-level theorems that pass the formal checker, working agentically with Mathlib search and code execution. See the <a href="https://www.vals.ai/benchmarks/proof_bench" target="_blank">Vals AI ProofBench leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Accuracy Standard Error", label: "Standard error", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%` },
        { column: "Reasoning effort", label: "Reasoning effort", optional: true },
        { column: "Cost per test (USD)", label: "Cost per test", optional: true, transform: formatCost },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    btf3: {
      name: "BTF-3",
      ediName: "BTF-3",
      description: 'A "pastcasting" benchmark where forecasting agents research already-resolved questions against a frozen web snapshot, scored on the Brier scale (lower is better).',
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://evals.futuresearch.ai/" target="_blank">FutureSearch evals page</a>. Lower scores are better.',
      source: "FutureSearch evals page",
      sourceLink: "https://evals.futuresearch.ai/",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Pooled score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Pooled score (lower is better)",
        tooltipTransform: (value) => parseFloat(value).toFixed(3)
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "BTF-3 pooled score (Brier scale, lower is better)",
        title: "AI forecasting error on resolved questions",
        tooltip: 'BTF-3 has forecasting agents research already-resolved questions against a frozen web snapshot. The pooled score is on the Brier scale, where lower is better and 0 is a perfect forecast. See the <a href="https://evals.futuresearch.ai/" target="_blank">FutureSearch evals page</a> for more information.',
        yAxisTickFormat: (v) => v.toFixed(2)
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Binary Brier", label: "Binary Brier", optional: true },
        { column: "Numeric RPS", label: "Numeric RPS", optional: true },
        { column: "Harness", label: "Harness", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    enigma_eval: {
      name: "EnigmaEval",
      ediName: "EnigmaEval",
      description: "A benchmark of long, multimodal puzzle-hunt puzzles requiring creative multi-step reasoning over mixed text and images.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://labs.scale.com/leaderboard/enigma_eval" target="_blank">Scale AI EnigmaEval leaderboard</a>.',
      source: "Scale AI EnigmaEval leaderboard",
      sourceLink: "https://labs.scale.com/leaderboard/enigma_eval",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "EnigmaEval accuracy",
        title: "AI performance on multimodal puzzle-hunt puzzles",
        tooltip: 'EnigmaEval measures long-form multimodal reasoning on puzzle-hunt puzzles, scored by exact match of the final answer. See the <a href="https://labs.scale.com/leaderboard/enigma_eval" target="_blank">Scale AI EnigmaEval leaderboard</a> for more information.',
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`,
        yAxisMax: 1
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Accuracy Standard Error", label: "Standard error", optional: true, transform: (value) => `${(parseFloat(value) * 100).toFixed(2)}%` },
        { column: "Company", label: "Company", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    lmca: {
      name: "LMCA",
      ediName: "LMCA",
      ediDisplayScale: 100,
      // Data is in the 0-100 range, EDI curve outputs 0-1, Python scales by 1/100
      description: "A benchmark measuring how well models judge the quality of conceptual arguments, scored by agreement with expert ratings.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://conceptualreasoning.ai/" target="_blank">Conceptual Reasoning Index leaderboard</a>.',
      source: "Conceptual Reasoning Index leaderboard",
      sourceLink: "https://conceptualreasoning.ai/lmca",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Score",
        transform: (value) => parseFloat(value),
        tooltipLabel: "LMCA score",
        tooltipTransform: (value) => parseFloat(value).toFixed(1)
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "LMCA score",
        title: "AI ability to judge conceptual arguments",
        tooltip: `LMCA measures how well models rate the quality of expert-written arguments against conceptual position texts. The score is the Pearson correlation between the model's ratings and the human expert ratings, times 100; the benchmark's authors estimate a ceiling of around 85. See the <a href="https://conceptualreasoning.ai/lmca" target="_blank">Conceptual Reasoning Index</a> for more information.`,
        yAxisTickFormat: (v) => v.toFixed(0)
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "Score 95% CI (\xB1)", label: "95% CI (\xB1)", optional: true },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    },
    dtbench: {
      name: "DTBench",
      ediName: "DTBench",
      description: "A benchmark of handcrafted multiple-choice questions testing models' understanding of the decision theory of Newcomb-like problems.",
      note: 'The data shown for this benchmark does not come from Epoch AI internal runs: it is sourced from the <a href="https://conceptualreasoning.ai/" target="_blank">Conceptual Reasoning Index leaderboard</a>.',
      source: "Conceptual Reasoning Index leaderboard",
      sourceLink: "https://conceptualreasoning.ai/dtbench",
      modelMapping: {
        releaseDateColumn: "Version release date"
      },
      accuracy: {
        column: "Accuracy",
        transform: (value) => parseFloat(value),
        tooltipLabel: "Accuracy",
        tooltipTransform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
      },
      errorBars: null,
      displayConfig: {
        yAxisLabel: "DTBench accuracy",
        title: "AI performance on decision theory questions",
        tooltip: `DTBench tests models' understanding of the decision theory of Newcomb-like problems with 407 multiple-choice capability questions. Random guessing scores 40%. See the <a href="https://conceptualreasoning.ai/dtbench" target="_blank">Conceptual Reasoning Index</a> for more information.`,
        yAxisTickFormat: (v) => `${(v * 100).toFixed(0)}%`
      },
      tooltipColumns: [
        RELEASE_DATE_TOOLTIP_COLUMN,
        { column: "CRI-rescaled score", label: "CRI-rescaled score", optional: true },
        {
          column: "EDT answer preference",
          label: "EDT answer preference",
          optional: true,
          transform: (value) => `${(parseFloat(value) * 100).toFixed(1)}%`
        },
        { column: "Source", label: "Source", optional: true, transform: createAnchor },
        { column: "Notes", label: "Notes", optional: true }
      ],
      highlightModels: {
        show: [],
        hide: []
      }
    }
  };
  if (typeof window !== "undefined") {
    window.legacyExports.externalBenchmarkConfigs = externalBenchmarkConfigs;
  }
})();
