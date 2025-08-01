package com.Stalk.project.stock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class KrxStockInfo {
    @JsonProperty("ISU_SRT_CD")
    private String ticker;
    
    @JsonProperty("ISU_ABBRV")
    private String name;
    
    @JsonProperty("TDD_CLSPRC")
    private String closePrice;
    
    @JsonProperty("CMPPREVDD_PRC")
    private String priceChange;
    
    @JsonProperty("FLUC_RT")
    private String changeRate;
    
    @JsonProperty("ACC_TRDVOL")
    private String volume;
    
    @JsonProperty("ACC_TRDVAL")
    private String tradeValue;
    
    @JsonProperty("MKTCAP")
    private String marketCap;
    
    @JsonProperty("LIST_SHRS")
    private String listedShares;
    
    // Constructors
    public KrxStockInfo() {}
    
    // Getters and Setters
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
    
    public String getClosePrice() {
        return closePrice;
    }
    
    public void setClosePrice(String closePrice) {
        this.closePrice = closePrice;
    }
    
    public String getPriceChange() {
        return priceChange;
    }
    
    public void setPriceChange(String priceChange) {
        this.priceChange = priceChange;
    }
    
    public String getChangeRate() {
        return changeRate;
    }
    
    public void setChangeRate(String changeRate) {
        this.changeRate = changeRate;
    }
    
    public String getVolume() {
        return volume;
    }
    
    public void setVolume(String volume) {
        this.volume = volume;
    }
    
    public String getTradeValue() {
        return tradeValue;
    }
    
    public void setTradeValue(String tradeValue) {
        this.tradeValue = tradeValue;
    }
    
    public String getMarketCap() {
        return marketCap;
    }
    
    public void setMarketCap(String marketCap) {
        this.marketCap = marketCap;
    }
    
    public String getListedShares() {
        return listedShares;
    }
    
    public void setListedShares(String listedShares) {
        this.listedShares = listedShares;
    }
}