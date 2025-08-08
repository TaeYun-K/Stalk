# KRX API Performance Optimization Recommendations

## Current Performance Issues

The current ranking system makes multiple API calls per request:

### Frontend Issues (✅ FIXED):
1. **Multiple API Calls**: 2 calls per ranking (KOSPI + KOSDAQ) 
2. **Client-side processing**: Combining, sorting, filtering on frontend
3. **No Caching**: Every request triggers new API calls
4. **Market Detection**: Wrong logic caused 404 errors

### Backend Optimization Needed:

## Recommended New Backend Endpoints

Create these combined endpoints for better performance:

### 1. Combined Volume Ranking
```
GET /api/krx/ranking/volume-ranking?limit=50&market=all|kospi|kosdaq
```
- Returns pre-combined and sorted volume rankings
- Server-side sorting and filtering
- Single API call instead of 2

### 2. Combined Price Rankings  
```
GET /api/krx/ranking/price-increase-ranking?limit=50&market=all|kospi|kosdaq
GET /api/krx/ranking/price-decrease-ranking?limit=50&market=all|kospi|kosdaq
```
- Returns pre-combined gainers/losers
- Server-side processing
- Market filtering handled on backend

### 3. Implementation Example (Java Spring Boot)

```java
@RestController
@RequestMapping("/api/krx/ranking")
public class RankingController {
    
    @GetMapping("/volume-ranking")
    public ResponseEntity<?> getVolumeRanking(
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(defaultValue = "all") String market) {
        
        // Combine KOSPI and KOSDAQ data on server
        List<StockRanking> kospiData = krxService.getKospiVolumeRanking(limit);
        List<StockRanking> kosdaqData = krxService.getKosdaqVolumeRanking(limit);
        
        List<StockRanking> combined = Stream.concat(kospiData.stream(), kosdaqData.stream())
            .filter(stock -> filterByMarket(stock, market))
            .sorted(Comparator.comparingLong(StockRanking::getVolume).reversed())
            .limit(limit)
            .collect(Collectors.toList());
            
        // Re-rank after combination
        for (int i = 0; i < combined.size(); i++) {
            combined.get(i).setRank(i + 1);
        }
        
        return ResponseEntity.ok(ApiResponse.success(combined));
    }
    
    private boolean filterByMarket(StockRanking stock, String market) {
        if ("all".equals(market)) return true;
        
        String ticker = stock.getTicker();
        if ("kospi".equals(market)) {
            return ticker.startsWith("00") || 
                   (!ticker.startsWith("9") && !ticker.startsWith("3") && !ticker.startsWith("1"));
        } else if ("kosdaq".equals(market)) {
            return ticker.startsWith("9") || ticker.startsWith("3") || ticker.startsWith("1");
        }
        return true;
    }
}
```

## Performance Benefits

### Before Optimization:
- Volume ranking: **2 API calls** + client processing
- Price ranking: **2 API calls** + client processing  
- No caching = repeated work
- Wrong market detection = 404 errors

### After Optimization:
- All rankings: **1 API call** with server processing
- Frontend caching: **5 minute TTL**
- Correct market detection
- Fallback to legacy endpoints if new ones don't exist

## Expected Improvements

1. **50% reduction** in API calls (2→1 per ranking request)
2. **Server-side processing** eliminates client-side sorting overhead
3. **Caching** reduces repeated API calls for same data
4. **Correct market detection** eliminates 404 errors for KOSDAQ stocks

## Migration Strategy

The frontend has been updated to:
1. ✅ Try optimized endpoints first
2. ✅ Fall back to legacy multi-call approach if needed
3. ✅ Add client-side caching (5 min TTL)
4. ✅ Fix market type detection logic

This allows gradual backend migration without breaking existing functionality.