'use client'

import * as React from "react"
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FileUploadZoneProps {
  id?: string
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  multiple?: boolean
  onFilesChange?: (files: File[]) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
  description?: string
}

export function FileUploadZone({
  id,
  accept = "*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 5,
  multiple = false,
  onFilesChange,
  onError,
  disabled = false,
  className,
  description
}: FileUploadZoneProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({})
  const inputRef = React.useRef<HTMLInputElement>(null)
  const descriptionId = description && id ? `${id}-description` : undefined

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`
    }
    
    if (accept !== "*") {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const fileMimeType = file.type
      
      const isAccepted = acceptedTypes.some(type => 
        type === fileExtension || type === fileMimeType || type === '*'
      )
      
      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`
      }
    }
    
    return null
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || disabled) return

    const fileArray = Array.from(newFiles)
    const totalFiles = files.length + fileArray.length

    if (!multiple && fileArray.length > 1) {
      onError?.("Only one file allowed")
      return
    }

    if (totalFiles > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validatedFiles: File[] = []
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        onError?.(error)
        return
      }
      validatedFiles.push(file)
    }

    const updatedFiles = multiple ? [...files, ...validatedFiles] : validatedFiles
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)

    // Simulate upload progress (replace with actual upload logic)
    validatedFiles.forEach(file => {
      simulateUploadProgress(file.name)
    })
  }

  const simulateUploadProgress = (fileName: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(prev => ({ ...prev, [fileName]: progress }))
      
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 200)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleFiles(e.target.files)
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          "flex flex-col items-center justify-center text-center",
          "hover:border-primary/50 hover:bg-accent/50",
          dragActive && "border-primary bg-accent",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          !dragActive && !disabled && "cursor-pointer"
        )}
        onClick={handleButtonClick}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          aria-describedby={descriptionId}
        />

        <Upload className={cn(
          "h-10 w-10 mb-4",
          dragActive ? "text-primary" : "text-muted-foreground"
        )} />

        <p className="text-sm font-medium mb-1">
          {dragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          or click to browse
        </p>

        <div className="text-xs text-muted-foreground space-y-1">
          {description && (
            <p id={descriptionId}>
              {description}
            </p>
          )}
          <p>Max file size: {formatFileSize(maxSize)}</p>
          {accept !== "*" && <p>Accepted formats: {accept}</p>}
          {multiple && <p>Max {maxFiles} files</p>}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const progress = uploadProgress[file.name] || 0
            const isUploading = progress < 100
            const isComplete = progress === 100

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  isComplete ? "bg-success-bg" : "bg-muted"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {isUploading && (
                    <Progress value={progress} className="mt-2 h-1" />
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="shrink-0"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
