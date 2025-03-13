import React, { useEffect, useState, useCallback } from 'react';
import './PlayVideo.css';
import { API_KEY, value_converter } from '../../data';
import moment from 'moment';
import { useParams } from 'react-router-dom';
// Import icons dari React Icons (asumsi sudah diinstal)
import { FaThumbsUp, FaThumbsDown, FaShare, FaBookmark, FaSpinner } from 'react-icons/fa';

const PlayVideo = () => {
    const { videoId } = useParams();
    const [apiData, setApiData] = useState(null);
    const [channelData, setChannelData] = useState(null);
    const [commentData, setCommentData] = useState([]);
    const [showMore, setShowMore] = useState(false);
    const [visibleComments, setVisibleComments] = useState(5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Gunakan useCallback untuk menghindari regenerasi fungsi
    const fetchVideoData = useCallback(async () => {
        try {
            setLoading(true);
            const videoDetails_url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${videoId}&key=${API_KEY}`;
            const res = await fetch(videoDetails_url);
            
            if (!res.ok) {
                throw new Error('Failed to fetch video data');
            }
            
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                setApiData(data.items[0]);
            } else {
                throw new Error('No video found');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching video data:', err);
        } finally {
            setLoading(false);
        }
    }, [videoId]);

    // Fungsi untuk fetch data channel dan komentar
    const fetchOtherData = useCallback(async () => {
        if (!apiData) return;
        
        try {
            // Fetch Channel Data
            const channelData_url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=${apiData.snippet.channelId}&key=${API_KEY}`;
            const channelRes = await fetch(channelData_url);
            
            if (!channelRes.ok) {
                throw new Error('Failed to fetch channel data');
            }
            
            const channelData = await channelRes.json();
            setChannelData(channelData.items[0]);

            // Fetch Comment Data
            const comment_url = `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies&maxResults=50&videoId=${videoId}&key=${API_KEY}`;
            const commentRes = await fetch(comment_url);
            
            if (!commentRes.ok) {
                throw new Error('Failed to fetch comments');
            }
            
            const commentData = await commentRes.json();
            if (commentData.items) {
                setCommentData(commentData.items);
            }
        } catch (err) {
            console.error('Error fetching channel or comment data:', err);
        }
    }, [apiData, videoId]);

    // Efek untuk fetch data video
    useEffect(() => {
        fetchVideoData();
    }, [fetchVideoData]);

    // Efek untuk fetch data tambahan setelah data video tersedia
    useEffect(() => {
        if (apiData) {
            fetchOtherData();
        }
    }, [apiData, fetchOtherData]);

    // Fungsi untuk mengatur tampilan komentar
    const toggleComments = (action) => {
        if (action === 'more') {
            setVisibleComments(prev => prev + 5);
        } else {
            setVisibleComments(5);
        }
    };

    // Render loading state
    if (loading && !apiData) {
        return (
            <div className="loading-container">
                <FaSpinner className="spinner" />
                <p>Loading video...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="error-container">
                <h3>Error loading video</h3>
                <p>{error}</p>
                <button onClick={fetchVideoData} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className='play-video'>
            {/* Video iframe with better aspect ratio handling */}
            <div className="video-container">
                <iframe 
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    title={apiData?.snippet?.title || "YouTube Video"}
                ></iframe>
            </div>

            {/* Video title with better handling of long titles */}
            <h1 className="video-title">{apiData?.snippet?.title || "Loading title..."}</h1>

            {/* Video info with improved layout and icon usage */}
            <div className='play-video-info'>
                <p className="view-count">
                    {value_converter(apiData?.statistics?.viewCount || "0")} views • {
                        apiData?.snippet?.publishedAt 
                            ? moment(apiData.snippet.publishedAt).fromNow() 
                            : ""
                    }
                </p>
                <div className="video-actions">
                    <button className="action-btn">
                        <FaThumbsUp /> <span>{value_converter(apiData?.statistics?.likeCount || "0")}</span>
                    </button>
                    <button className="action-btn">
                        <FaThumbsDown />
                    </button>
                    <button className="action-btn">
                        <FaShare /> <span>Share</span>
                    </button>
                    <button className="action-btn">
                        <FaBookmark /> <span>Save</span>
                    </button>
                </div>
            </div>

            <hr className="divider" />

            {/* Channel info with improved layout */}
            <div className='publisher'>
                {channelData?.snippet?.thumbnails?.default?.url && (
                    <img 
                        src={channelData.snippet.thumbnails.default.url} 
                        alt={apiData?.snippet?.channelTitle || "Channel"} 
                        className="channel-avatar"
                    />
                )}
                <div className="channel-info">
                    <p className="channel-name">{apiData?.snippet?.channelTitle || "Channel Name"}</p>
                    <span className="subscriber-count">
                        {channelData ? value_converter(channelData.statistics.subscriberCount) : "0"} Subscribers
                    </span>
                </div>
                <button className="subscribe-btn">Subscribe</button>
            </div>

            {/* Video description with improved show more/less functionality */}
            <div className="video-description-container">
                <div className={`video-description ${showMore ? 'expanded' : ''}`}>
                    <p>{apiData?.snippet?.description || "No description available."}</p>
                </div>
                {apiData?.snippet?.description && apiData.snippet.description.length > 250 && (
                    <button 
                        className="toggle-description-btn" 
                        onClick={() => setShowMore(!showMore)}
                    >
                        {showMore ? "Show Less" : "Show More"}
                    </button>
                )}
            </div>

            <hr className="divider" />

            {/* Comments section with improved styling */}
            <div className="comments-section">
                <h3 className="comments-header">
                    {apiData ? value_converter(apiData.statistics.commentCount) : "0"} Comments
                </h3>

                {commentData.length === 0 ? (
                    <p className="no-comments">No comments available</p>
                ) : (
                    <>
                        <div className="comments-list">
                            {commentData.slice(0, visibleComments).map((item, index) => (
                                <div key={index} className='comment'>
                                    <img 
                                        src={item.snippet.topLevelComment.snippet.authorProfileImageUrl} 
                                        alt={item.snippet.topLevelComment.snippet.authorDisplayName} 
                                        className="commenter-avatar"
                                    />
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <h4>{item.snippet.topLevelComment.snippet.authorDisplayName}</h4>
                                            <span className="comment-time">
                                                {moment(item.snippet.topLevelComment.snippet.publishedAt).fromNow()}
                                            </span>
                                        </div>
                                        <p className="comment-text">{item.snippet.topLevelComment.snippet.textDisplay}</p>
                                        <div className='comment-actions'>
                                            <button className="comment-action-btn">
                                                <FaThumbsUp className="comment-icon" />
                                                <span>{value_converter(item.snippet.topLevelComment.snippet.likeCount)}</span>
                                            </button>
                                            <button className="comment-action-btn">
                                                <FaThumbsDown className="comment-icon" />
                                            </button>
                                            <button className="comment-action-btn reply-btn">
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="comment-pagination">
                            {visibleComments < commentData.length && (
                                <button className='show-more-btn' onClick={() => toggleComments('more')}>
                                    Show More Comments
                                </button>
                            )}

                            {visibleComments > 5 && (
                                <button className='show-less-btn' onClick={() => toggleComments('less')}>
                                    Show Less Comments
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayVideo;