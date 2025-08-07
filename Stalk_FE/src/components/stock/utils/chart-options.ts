/**
 * Chart.js configuration options following Google Code Style
 */

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

export const getTickSettings = (periodDays: number) => {
  if (periodDays === 1) {
    // For intraday, show every 2 hours
    return { maxTicksLimit: 8, maxRotation: 0 };
  } else if (periodDays <= 7) {
    // For week view, show all days
    return { maxTicksLimit: 7, maxRotation: 0 };
  } else if (periodDays <= 30) {
    // For month view, show weekly ticks
    return { maxTicksLimit: 8, maxRotation: 45 };
  } else if (periodDays <= 90) {
    // For 3 months, show bi-weekly
    return { maxTicksLimit: 12, maxRotation: 45 };
  } else {
    // For longer periods, limit ticks
    return { maxTicksLimit: 15, maxRotation: 45 };
  }
};

export const getMainChartOptions = (darkMode: boolean, periodDays: number) => {
  const tickSettings = getTickSettings(periodDays);
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('종가') || label.includes('MA') || label.includes('EMA')) {
              return `${label}: ${value?.toLocaleString()}원`;
            } else if (label.includes('거래량')) {
              return `${label}: ${formatVolume(value)}`;
            } else if (label.includes('RSI') || label.includes('Stochastic')) {
              return `${label}: ${value?.toFixed(2)}%`;
            }
            return `${label}: ${value?.toFixed(2)}`;
          },
        },
      },
      zoom: {
        limits: {
          y: {min: 'original', max: 'original'},
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x' as const,
        },
        pan: {
          enabled: true,
          mode: 'x' as const,
          modifierKey: 'shift' as const,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
        },
        ticks: {
          maxTicksLimit: tickSettings.maxTicksLimit,
          maxRotation: tickSettings.maxRotation,
          minRotation: 0,
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          autoSkip: true,
          autoSkipPadding: 5,
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };
};

export const getVolumeChartOptions = (darkMode: boolean) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '거래량',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        ticks: {
          callback: function(value: any) {
            return formatVolume(value);
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };
};

export const getRsiChartOptions = (darkMode: boolean) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'RSI',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        min: 0,
        max: 100,
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };
};

export const getMacdChartOptions = (darkMode: boolean) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'MACD',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };
};