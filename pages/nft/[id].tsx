import React, { useEffect, useState } from 'react'
import { useAddress, useDisconnect, useMetamask , useNFTDrop} from "@thirdweb-dev/react";
import { GetServerSideProps } from 'next';
import { sanityClient, urlFor } from '../../sanity';
import {Collection} from '../../typings';
import Link from 'next/link';
import { BigNumber } from 'ethers';
import toast,{Toaster} from 'react-hot-toast';

interface Props{
   collection:Collection
}

function NFTDropPage({collection}: Props) {

    const[claimedSupply, setClaimedSupply] = useState<number>(0);

    const [totalSupply,setTotalSupply] = useState<BigNumber>();
    const[loading,setLoading] = useState<boolean>(true);
    const[price,setPrice]=useState<string>();

    const nftDrop= useNFTDrop(collection.address);

     //Auth
      const connectWithMetamask=useMetamask();

      const address=useAddress();

      const disconnect=useDisconnect();
      
      console.log(address);


     
      useEffect(()=>{
        if(!nftDrop) return
        const fetchPrice = async () => {
           const claimConditions = await nftDrop.claimConditions.getAll(); // gets the claim phases.
           setPrice(claimConditions?.[0].currencyMetadata.displayValue)
        }
        fetchPrice();
      },[nftDrop])

      useEffect(() => {
          if(!nftDrop) return;
          const fetchNFTDropData = async()=>{
            setLoading(true);
            const claimed = await nftDrop.getAllClaimed();
            const total = await nftDrop.totalSupply();
            setClaimedSupply(claimed.length)
            setTotalSupply(total)
            setLoading(false);
          }
          fetchNFTDropData();
      }, [nftDrop])


      const mintNFT = ()=>{
          if(!nftDrop || !address) return;
          
          const quantity=1;
          setLoading(true);
          const notification = toast.loading("Minting ....",{
            style:{
              background:'white',
              color:'green',
              fontWeight:'bold',
               fontSize:'17px',
               padding:'20px',
            }
          });
          nftDrop.claimTo(address,quantity).then( async (tx)=>{
                    const receipt= tx[0].receipt;
                    const claimedTokenId = tx[0].id;
                    const claimedNFT =await  tx[0].data();

                    toast('Hurray ! You Successfully Minted!!!!',{
                      duration:5000,
                      style:{
                        background:'white',
              color:'green',
              fontWeight:'bold',
               fontSize:'17px',
               padding:'20px',
                      }
                    })
          }). catch(err => {
            console.log(err);
            toast('Oops!! Something went wrong',{
              style:{
                background:'white',
              color:'red',
              fontWeight:'bold',
               fontSize:'17px',
               padding:'20px',
              }
            })
          }).finally(()=>{
            setLoading(false);
            toast.dismiss(notification);
          })

      }

  return (
    <div className='flex h-screen flex-col lg:grid lg:grid-cols-10 '>
      <Toaster position='top-center'/>

      <div className='lg:col-span-4 bg-gradient-to-br from-cyan-800 to-rose-500'> 
      
        <div className='flex flex-col items-center justify-center py-2 lg:min-h-screen'>

          <div className='bg-gradient-to-br from-yellow-400 to-purple-600 p-2 rounded-xl'>

          <img className='w-44 rounded-xl object-cover lg:h-96 lg:w-72' 
          src={urlFor(collection.previewImage).url()}
          alt=""
          />

          </div>

           <div className='text-center p-5 space-y-2'>

             <h1 className='text-4xl font-bold text-white font-mono'>{collection.nftCollectionName}</h1>

             <h2 className='text-xl text-gray-300 font-mono'> 
               {collection.description}
             </h2>

           </div>

        </div>
      </div>
{/* Right */}

      <div className='flex flex-1 flex-col p-12 lg:col-span-6'>
          {/* header */}
          <header className='flex items-center justify-between'>

              <h1 className='w-52 cursor-pointer text-xl font-extralight sm:w-80 font-mono'><Link href='/'><span className='font-bold underline decoration-pink-600'> VISHAL's</span></Link> NFT Market Place</h1>

               <button onClick={() => {address? disconnect():connectWithMetamask()}} className='rounded-full font-mono bg-rose-400 text-white px-4 py-2 text-xs font-bold lg:px-5 lg:py-3 lg:text-base'>{address?'Sign Out':'Sign In'}</button> 

          </header>

          <hr className='my-2 border'/>

          {address && (
               <p className='font-mono text-extrasmall text-center text-rose-500 '>You are logged in with wallet {address.substring(0,5)}....{address.substring(address.length-5)}</p>
          )}

          {/* Content */}

          <div className='mt-5 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:'>

               <img 
                 className='w-80 object-cover pb-10 lg:h-50'
                 src={urlFor(collection.mainImage).url()}
                 alt=""
               />

               <h1 className='text-3xl font-bold font-mono lg:text-5xl lg:font-bold'>
                   {collection.title}
               </h1>
               {loading? ( <p className='text-small pt-2 font-mono text-green-500 animate-pulse '>Loading Supply Count....</p>):( <p className='text-small pt-2 font-mono text-green-500 '>{claimedSupply}/{totalSupply?.toString()} NFT's claimed</p>)}
              
               {loading && (
                  <img className='h-60 w-60 object-contain'src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif" alt=""/>
               )}
          </div>

          {/* Mint Button */}
          <button onClick={mintNFT} disabled={loading || claimedSupply===totalSupply?.toNumber() || !address} className='h-16 w-full bg-red-600/90 font-semibold text-xl text-white rounded-full mt-10 font-mono disabled:bg-gray-400 '>
               {loading?(
                 <>Loading</>
               ):claimedSupply===totalSupply?.toNumber()?(
                   <>Sold Out</>
               ): !address?(
                   <>Please Sign In to Mint</>
               ):(
                <span>Mint NFT({price}ETH)</span>
               )}
              
          </button>
      </div>

    </div>
  )
}

export default NFTDropPage

export const getServerSideProps:GetServerSideProps = async ({params})=>{
  const query =`*[_type == "collection" && slug.current== $id][0]{
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage{
        asset
     },
    previewImage{
      asset
    },
    slug{
      current
    },
    creator->{
      _id,
      name,
      address,
      slug{
       current,
    },
    },
  }`

  const collection = await sanityClient.fetch(query, {
    id:params?.id

  })

  if(!collection)
  {
     return {
      notFound:true
     }
  }

  return {
    props: {
      collection
    }
  }

}

