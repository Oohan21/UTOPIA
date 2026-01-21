'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  accept?: string
  multiple?: boolean
  maxSize?: number
}

export default function ImageUploader({
  onUpload,
  maxFiles = 10,
  accept = 'image/*',
  multiple = true,
  maxSize = 5 * 1024 * 1024 // 5MB default
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return false
    }

    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    setError(null)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (validateFile(file)) {
        validFiles.push(file)
      }
    }

    if (validFiles.length > 0) {
      if (validFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} will be uploaded.`)
        validFiles.splice(maxFiles)
      }

      setUploading(true)
      setProgress(0)

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setUploading(false)
            onUpload(validFiles)
            return 100
          }
          return prev + 10
        })
      }, 100)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        id="image-upload"
      />

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {uploading ? (
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              {uploading ? 'Uploading...' : 'Drag & drop images here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, WEBP • Max size: {maxSize / (1024 * 1024)}MB each
            </p>
          </div>

          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Images
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}