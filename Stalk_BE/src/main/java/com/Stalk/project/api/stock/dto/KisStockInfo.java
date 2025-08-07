package com.Stalk.project.api.stock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for KIS API historical stock price data
 */
public class KisStockInfo {
    
    @JsonProperty("stck_bsop_date")
    private String date; // 주식 영업 일자
    
    @JsonProperty("stck_clpr")
    private String closePrice; // 주식 종가
    
    @JsonProperty("stck_oprc")
    private String openPrice; // 주식 시가
    
    @JsonProperty("stck_hgpr")
    private String highPrice; // 주식 최고가
    
    @JsonProperty("stck_lwpr")
    private String lowPrice; // 주식 최저가
    
    @JsonProperty("acml_vol")
    private String volume; // 누적 거래량
    
    @JsonProperty("acml_tr_pbmn")
    private String tradeAmount; // 누적 거래 대금
    
    @JsonProperty("flng_cls_code")
    private String changeCode; // 등락 구분 코드
    
    @JsonProperty("prdy_vrss")
    private String priceChange; // 전일 대비
    
    @JsonProperty("prdy_vrss_sign")
    private String changeSign; // 전일 대비 부호
    
    @JsonProperty("prdy_ctrt")
    private String changeRate; // 전일 대비율
    
    @JsonProperty("prtt_rate")
    private String participationRate; // 참여율
    
    @JsonProperty("mod_yn")
    private String modificationYn; // 수정주가여부
    
    @JsonProperty("revl_issu_reas")
    private String revlIssuReas; // 재평가 이슈 사유
    
    // Basic fields for consistency with KrxStockInfo
    private String ticker;
    private String name;
    
    // Constructors
    public KisStockInfo() {}
    
    // Getters and Setters
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public String getClosePrice() {
        return closePrice;
    }
    
    public void setClosePrice(String closePrice) {
        this.closePrice = closePrice;
    }
    
    public String getOpenPrice() {
        return openPrice;
    }
    
    public void setOpenPrice(String openPrice) {
        this.openPrice = openPrice;
    }
    
    public String getHighPrice() {
        return highPrice;
    }
    
    public void setHighPrice(String highPrice) {
        this.highPrice = highPrice;
    }
    
    public String getLowPrice() {
        return lowPrice;
    }
    
    public void setLowPrice(String lowPrice) {
        this.lowPrice = lowPrice;
    }
    
    public String getVolume() {
        return volume;
    }
    
    public void setVolume(String volume) {
        this.volume = volume;
    }
    
    public String getTradeAmount() {
        return tradeAmount;
    }
    
    public void setTradeAmount(String tradeAmount) {
        this.tradeAmount = tradeAmount;
    }
    
    public String getChangeCode() {
        return changeCode;
    }
    
    public void setChangeCode(String changeCode) {
        this.changeCode = changeCode;
    }
    
    public String getPriceChange() {
        return priceChange;
    }
    
    public void setPriceChange(String priceChange) {
        this.priceChange = priceChange;
    }
    
    public String getChangeSign() {
        return changeSign;
    }
    
    public void setChangeSign(String changeSign) {
        this.changeSign = changeSign;
    }
    
    public String getChangeRate() {
        return changeRate;
    }
    
    public void setChangeRate(String changeRate) {
        this.changeRate = changeRate;
    }
    
    public String getParticipationRate() {
        return participationRate;
    }
    
    public void setParticipationRate(String participationRate) {
        this.participationRate = participationRate;
    }
    
    public String getModificationYn() {
        return modificationYn;
    }
    
    public void setModificationYn(String modificationYn) {
        this.modificationYn = modificationYn;
    }
    
    public String getRevlIssuReas() {
        return revlIssuReas;
    }
    
    public void setRevlIssuReas(String revlIssuReas) {
        this.revlIssuReas = revlIssuReas;
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
}