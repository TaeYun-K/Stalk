package com.Stalk.project.api.ai.dao;

import com.Stalk.project.api.ai.model.VideoSummary;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface VideoSummaryMapper {

  void insertSummary(VideoSummary summary);

  VideoSummary findById(Long id);
}