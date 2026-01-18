import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { analyzeSentiment } from '../api/social';

const SentimentAnalysisCard = ({ postId, comments = [], onRefreshed }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!comments || comments.length === 0) {
            setError("No comments to analyze.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Extract just the message text from comments
            const commentTexts = comments.map(c => c.message || c.text).filter(Boolean);

            if (commentTexts.length === 0) {
                throw new Error("No readable text found in comments.");
            }

            const res = await analyzeSentiment({
                post_id: postId,
                comments: commentTexts
            });

            setResult(res);
            if (onRefreshed) onRefreshed();
        } catch (err) {
            console.error("Analysis failed", err);
            setError("Failed to analyze sentiment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        const s = (sentiment || '').toLowerCase();
        if (s.includes('positive')) return '#10B981'; // Green
        if (s.includes('negative')) return '#EF4444'; // Red
        return '#6B7280'; // Gray (Neutral)
    };

    const getSentimentBg = (sentiment) => {
        const s = (sentiment || '').toLowerCase();
        if (s.includes('positive')) return '#ECFDF5';
        if (s.includes('negative')) return '#FEF2F2';
        return '#F3F4F6';
    };

    if (loading) {
        return (
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center justify-center py-8">
                <ActivityIndicator size="small" color="#0B3D2E" />
                <Text className="text-gray-500 text-sm mt-3 font-medium">Analyzing sentiment...</Text>
            </View>
        );
    }

    if (result) {
        const color = getSentimentColor(result.sentiment);
        const bg = getSentimentBg(result.sentiment);

        return (
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-semibold text-gray-800">Comment Sentiment Analysis</Text>
                    <View style={{ backgroundColor: bg }} className="px-3 py-1 rounded-full">
                        <Text style={{ color: color }} className="text-xs font-bold uppercase">
                            {result.sentiment}
                        </Text>
                    </View>
                </View>

                <Text className="text-sm text-gray-600 leading-6 mb-4">
                    {result.summary}
                </Text>

                <TouchableOpacity
                    onPress={handleAnalyze}
                    className="flex-row items-center justify-center py-2 bg-gray-50 rounded-lg"
                >
                    <Ionicons name="refresh" size={16} color="#4B5563" />
                    <Text className="text-gray-600 text-sm font-medium ml-2">Analyze Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-[#E0FAFA] items-center justify-center mr-3">
                    <Ionicons name="analytics" size={20} color="#0B3D2E" />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">Analyze Comment Sentiment</Text>
                    <Text className="text-xs text-gray-500">
                        {comments.length} comments available for analysis
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={handleAnalyze}
                disabled={comments.length === 0}
                className={`w-full py-3 rounded-xl flex-row items-center justify-center ${comments.length === 0 ? 'bg-gray-100' : 'bg-[#0B3D2E]'}`}
            >
                <Ionicons name="sparkles" size={18} color={comments.length === 0 ? '#9CA3AF' : 'white'} />
                <Text className={`font-semibold ml-2 ${comments.length === 0 ? 'text-gray-400' : 'text-white'}`}>
                    Generate Analysis
                </Text>
            </TouchableOpacity>

            {error && (
                <Text className="text-red-500 text-xs mt-3 text-center">{error}</Text>
            )}
        </View>
    );
};

export default SentimentAnalysisCard;
