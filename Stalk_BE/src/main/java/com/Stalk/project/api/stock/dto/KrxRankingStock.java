package com.Stalk.project.api.stock.dto;

public class KrxRankingStock {
    private int rank;
    private String ticker;
    private String name;
    private double price;
    private double change;
    private double changeRate;
    private String volume;
    private String marketCap;
    private String tradeValue;
    
    // Constructors
    public KrxRankingStock() {}
    
    public KrxRankingStock(int rank, String ticker, String name, double price, 
                          double change, double changeRate, String volume, 
                          String marketCap, String tradeValue) {
        this.rank = rank;
        this.ticker = ticker;
        this.name = name;
        this.price = price;
        this.change = change;
        this.changeRate = changeRate;
        this.volume = volume;
        this.marketCap = marketCap;
        this.tradeValue = tradeValue;
    }
    
    // Getters and Setters
    public int getRank() {
        return rank;
    }
    
    public void setRank(int rank) {
        this.rank = rank;
    }
    
    public String getTicker() {
        return ticker;
    }
    
    public void setTicker(String ticker) {
        this.ticker = ticker;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public double getPrice() {
        return price;
    }
    
    public void setPrice(double price) {
        this.price = price;
    }
    
    public double getChange() {
        return change;
    }
    
    public void setChange(double change) {
        this.change = change;
    }
    
    public double getChangeRate() {
        return changeRate;
    }
    
    public void setChangeRate(double changeRate) {
        this.changeRate = changeRate;
    }
    
    public String getVolume() {
        return volume;
    }
    
    public void setVolume(String volume) {
        this.volume = volume;
    }
    
    public String getMarketCap() {
        return marketCap;
    }
    
    public void setMarketCap(String marketCap) {
        this.marketCap = marketCap;
    }
    
    public String getTradeValue() {
        return tradeValue;
    }
    
    public void setTradeValue(String tradeValue) {
        this.tradeValue = tradeValue;
    }
}