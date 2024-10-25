'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Post {
  id?: number
  title: string
  description?: string
  image_url?: string
  created_at: string
}

export default function Page() {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [mounted, setMounted] = useState<Boolean>(false)
  const [newPost, setNewPost] = useState<Post>({ title: '', description: '', image_url: '', created_at: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const supabase = createClient();


  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('attachment').upload(fileName, file)

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    const { data } = supabase
      .storage
      .from('attachment')
      .getPublicUrl(fileName);
    return data
  }

  const handleCreatePost = async () => {
    const { title, description } = newPost
    if (!title) {
      alert("Title are required!")
      return
    }
    let imageUrl
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }
    console.log('image:', imageUrl)

    const { data, error } = await supabase.from('posts')
      .insert([{
        title, description, image_url: imageUrl
      }])
    if (error) {
      console.error('Error creating post:', error)
    } if (data) {
      console.log('Post created:', data)
      // After creating a new post, update the posts state to include the new post
      setPosts([...posts!, ...data])
      setNewPost({ title: '', description: '', image_url: '', created_at: '' })
      setImageFile(null)
    }
  }

  const handleDeletePost = async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error deleting task:', error)
    } else {
      console.log('Post deleted:', data)
      setPosts(posts?.filter((post) => post.id !== id) || null)
    }
  }

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('posts').select()
      setPosts(data)
    }
    getData()
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <p>Loading...</p>
    )
  }

  return (
    <div className='flex flex-col gap-2 justify-start border-2'>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className='w-[100px]'>New Post</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Post</AlertDialogTitle>
            <AlertDialogDescription>
              Please fill out the details to create a new post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 p-4">
            <Input
              type="text"
              placeholder="Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreatePost}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='grid grid-cols-6 gap-2'>
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle className='truncate'>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {post.image_url && (
                <img src={post.image_url} alt={post.title} style={{ maxWidth: '100%', height: 'auto' }} />
              )}
              <p className='truncate'>{post.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={() => handleDeletePost(post.id!)}>Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

    </div>
  )

}