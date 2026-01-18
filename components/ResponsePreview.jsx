import { useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import KeywordEditor from './KeywordEditor'
import PlatformSelector from './PlatformSelector'

//add x or back button on modal
const ResponsePreview = ({ response }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <View className='p-3  border-b   border-gray-100 rounded-xl mb-2'>
          <Text className='font-inter font-semibold '>{response.title}</Text>
          <Text className='text-sm mt-1 '>{response.content}</Text>
          <View className='flex-row mt-2'>
            {response.keywords.map((k, i) => (
              <Text key={i} className='text-xs mr-2 mb-3 p-2 border bg-BGCSec border-gray-300 rounded-full'>{k}</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType='slide'>
        <View className='flex-1 justify-center items-center bg-black/30'>
          <View className='bg-white p-5 rounded-xl w-[90%]'>
            <Text className='font-inter font-semibold text-lg mb-3'>{response.title}</Text>

            <Text className='font-inter font-semibold mb-1'>Re-Select Platforms</Text>
            <PlatformSelector selectedPlatforms={response.platforms} onChange={()=>{}} />

            <Text className='font-inter font-semibold mt-4 mb-1'>Edit Keywords</Text>
            <KeywordEditor initialKeywords={response.keywords} />

            <TouchableOpacity className='mt-5 bg-red-600 rounded-full'>
              <Text className='text-center color-white p-2 font-inter'>Delete Response</Text>
            </TouchableOpacity>

            <TouchableOpacity className='mt-3 bg-LogoGreen rounded-full' onPress={() => setShowModal(false)}>
              <Text className='text-center p-2 font-inter text-white'>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

export default ResponsePreview
