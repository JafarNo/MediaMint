import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import Logo from '../assets/images/logo-no-text.png';

export default function LandingPage(){
    const router= useRouter();
    const [showButton,setShowButton] = useState(false);

    const title='MediaMint';
    const animations= useRef(
        title.split('').map(()=> new Animated.Value(0))
    ).current;
    const taglineOpacity= useRef(new Animated.Value(0)).current;
    const taglineTranslate= useRef(new Animated.Value(10)).current;

    const buttonOpacity= useRef(new Animated.Value(0)).current;
    const buttonTranslate= useRef(new Animated.Value(20)).current;

    // Logo animation
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoTranslate = useRef(new Animated.Value(-50)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;

    useEffect(()=>{
        // First animate the logo dropping in
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true
            }),
            Animated.spring(logoTranslate, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true
            }),
        ]).start(() => {
            // Then animate the title letters
            const animation= animations.map((animation,i)=>
                Animated.timing(animation,{
                    toValue:1,
                    duration:350,
                    delay:i*100,
                    useNativeDriver:true
                })
            );
            Animated.stagger(80,animation).start(()=>
                Animated.parallel([
                    Animated.timing(taglineOpacity,{
                        toValue:1,
                        duration:600,
                        useNativeDriver:true
                    }),
                    Animated.timing(taglineTranslate,{
                        toValue:0,
                        duration:600,
                        useNativeDriver:true
                    }),
                ]).start()
            );
        });
    }, []);

    useEffect(()=>{
        const timer= setTimeout(() => {
            setShowButton(true);
            Animated.parallel([
                Animated.timing(buttonOpacity,{
                    toValue:1,
                    duration:500,
                    useNativeDriver:true
                }),
                Animated.timing(buttonTranslate,{
                    toValue:0,
                    duration:500,
                    useNativeDriver:true
                }),
            ]).start();
        }, 2200);
        return () => clearTimeout(timer);
    },[]);

    return (
        <LinearGradient
            colors={['#0B3D2E', '#0F5132', '#145A32']}
            className=" w-full h-full "
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                
                <Animated.Image
                    source={Logo}
                    style={{
                        width: 120,
                        height: 120,
                        marginBottom: 20,
                        opacity: logoOpacity,
                        transform: [
                            { translateY: logoTranslate },
                            { scale: logoScale }
                        ],
                    }}
                    resizeMode="contain"
                />
                
                <View style={{ flexDirection: 'row', marginBottom: 12, justifyContent: 'center', alignItems: 'center' }}>
                    {title.split('').map((letter,index)=>(
                        <Animated.Text
                            key={index}
                            style={{
                                fontSize: 36,
                                fontWeight: 'bold',
                                color: 'white',
                                opacity: animations[index],
                                transform:[
                                    {
                                        translateY:animations[index].interpolate({
                                            inputRange: [0,1],
                                            outputRange:[-25,0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            {letter}
                        </Animated.Text>
                    ))}
                </View>
                
                <Animated.Text
                    style={{
                        fontSize: 16,
                        color: 'white',
                        textAlign: 'center',
                        marginBottom: 40,
                        opacity: taglineOpacity,
                        transform: [{translateY: taglineTranslate}],
                    }}
                >
                    All your socials, in one place.
                </Animated.Text>
                
                {showButton && (
                    <Animated.View
                        style={{
                            opacity: buttonOpacity,
                            transform: [{translateY: buttonTranslate}],
                            alignItems: 'center',
                        }}
                    >
                        <TouchableOpacity 
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: '#F5F5DC',
                                paddingHorizontal: 48,
                                paddingVertical: 14,
                                borderRadius: 30,
                            }}
                            onPress={()=> router.replace('/Signup')}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0B3D2E' }}>Get Started</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </LinearGradient>
    );
}