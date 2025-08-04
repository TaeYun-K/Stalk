package com.Stalk.project.api.favorite.dto.in;

public enum PreferredTradeStyle {
    SHORT("단기"),
    MID_SHORT("중단기"), 
    MID("중기"),
    MID_LONG("중장기"),
    LONG("장기");
    
    private final String description;
    
    PreferredTradeStyle(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
