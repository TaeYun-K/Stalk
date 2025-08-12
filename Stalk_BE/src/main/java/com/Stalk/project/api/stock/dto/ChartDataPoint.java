package com.Stalk.project.api.stock.dto;

public class ChartDataPoint {
    private String date;
    private double close;
    private long volume;

    public ChartDataPoint() {}

    public ChartDataPoint(String date, double close, long volume) {
        this.date = date;
        this.close = close;
        this.volume = volume;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public double getClose() {
        return close;
    }

    public void setClose(double close) {
        this.close = close;
    }

    public long getVolume() {
        return volume;
    }

    public void setVolume(long volume) {
        this.volume = volume;
    }
}