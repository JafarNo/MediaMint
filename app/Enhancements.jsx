import CustomSwitch from '@/components/CustomSwitch';
import { Video } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function Enhancements() {
    const[VideoURI, setVideoURI]=useState(null);

    const[addMusic, setAddmusic]=useState(false);
    const[addCaptions, setAddCaptions]=useState(false);
    const[addVoiceOver, setAddVoiceOver]=useState(false);

    const pickVideo= async()=>{
       const {status}= await ImagePicker.requestMediaLibraryPermissionsAsync();
       if(status !== "granted") {
         return;
       }
       
    const res= await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing:true,
        quality:1,
        
    });
    if(!res.canceled){
        setVideoURI(res.assets[0].uri);
    }
    };
    const EnhanmentHandling= ()=>{
        if(!VideoURI) return;

        const enhancements={
            music: addMusic,
            captions: addCaptions,
            voiceOver: addVoiceOver
        };
        // TODO: Send VideoURI and enhancements to backend
    };
return(
  <KeyboardAwareScrollView
      className='bg-BGColor flex-1'
      contentContainerStyle={{ paddingBottom: 75 }}
      showsVerticalScrollIndicator={false}
    >
<View className="mb-6 mt-6 px-5">
    <Text className="text-3xl font-bold mb-6">Enhance Your Video</Text>
    {!VideoURI &&(
        <TouchableOpacity 
        className={`border-2 border-dashed border-LogoGreen rounded-2xl py-16 justify-center items-center ${!VideoURI ?'':'opacity-50'}`}
        onPress={pickVideo}
        disabled={!!VideoURI}
        activeOpacity={0.7}
        >
        <Text className="text-lg font-semibold text-LogoGreen">Upload Video from Gallery</Text>
        <Text className="text-sm text-gray-500 mt-2">Video Only</Text>
        </TouchableOpacity>
    )}
    {VideoURI &&(
        <View className="mb-6">
            <Video 
            source={{uri:VideoURI}}
            style={{width:'100%', height:240, borderRadius:16}}
            useNativeControls
            resizeMode="contain"
            />
        </View>
    )}
    
        <View className={`bg-white rounded-2xl mb-6 p-6 shadow-sm border border-gray-100 ${!VideoURI ? 'opacity-50':''}`}
        pointerEvents={VideoURI? 'auto': 'none'}
        >
            <Text className="text-xl font-bold mb-4">Enhancements</Text>
            <EnhanceRow
               title= "Add Music"
               subtitle="Background soundtrack"
               value={addMusic}
               onChange={setAddmusic}
               disabled={!VideoURI}
            />
            <EnhanceRow
               title= "Add Captions"
               subtitle="auto subtitles"
               value={addCaptions}
               onChange={(v)=>{
                setAddCaptions(v);
                if(!v) setAddVoiceOver(false);
               }}
                disabled={!VideoURI}
            />
            <EnhanceRow
               title= "Add Voice Over"
               subtitle="Spoken audio"
               value={addVoiceOver}
               disabled={!VideoURI || !addCaptions }
               onChange={setAddVoiceOver}
               
            />
        </View>
   
        <View className='items-center justify-center mt-6'>
        <TouchableOpacity 
        className="bg-primary rounded-2xl py-4 w-full"
        onPress={EnhanmentHandling}
        disabled={!VideoURI}
        activeOpacity={0.8}
        >
            <Text className={`text-center text-lg font-semibold text-white ${ !VideoURI ?'opacity-50':''}`}>Enhance Video</Text>
        </TouchableOpacity>
        </View>
   
    
</View>
</KeyboardAwareScrollView>
);
}

const EnhanceRow=({title,subtitle,value, onChange, disabled})=>(
<View className="flex-row items-center justify-between mb-5">
    <View className="flex-1">
        <Text className={`text-base font-semibold ${disabled ? 'text-gray-400':''}`}>
            {title}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
    </View>
    <CustomSwitch 
    value={value}
    onValueChange={onChange}
    disabled={disabled}
    />
</View>
);