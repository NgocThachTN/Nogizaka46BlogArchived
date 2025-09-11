import { ProList } from '@ant-design/pro-components'
import React from 'react'
import { blogs } from './data/blogs'
import './App.css'

function App() {
  return (
    <ProList
      rowKey="id"
      headerTitle="Nogizaka46 Blog Archive"
      dataSource={blogs}
      metas={{
        title: { dataIndex: 'title' },
        description: { dataIndex: 'member' },
        extra: { dataIndex: 'date' },
        content: { dataIndex: 'content' },
      }}
    />
  )
}

export default App
