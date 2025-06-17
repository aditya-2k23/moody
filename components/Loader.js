import React from 'react'

export default function Loader() {
  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4'>
      <i className="fas fa-spinner animate-spin text-4xl text-indigo-600 sm:text-5xl"></i>
    </div>
  )
}
