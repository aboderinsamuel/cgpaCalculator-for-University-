"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, Download, Upload, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Course {
  id: string
  code: string
  grade: string
  creditHours: number
}

interface SavedData {
  courses: Course[]
  scale: "4.0" | "5.0"
  lastUpdated: string
}

export default function CGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([])
  const [scale, setScale] = useState<"4.0" | "5.0">("5.0")
  const [cgpa, setCgpa] = useState<number>(0)
  const { toast } = useToast()

  // Grade point mappings - UNILAG system
  const gradePoints = {
    "5.0": {
      "A": 5.0,
      "B": 4.0, 
      "C": 3.0,
      "D": 2.0,
      "E": 1.0,
      "F": 0.0
    },
    "4.0": {
      "A": 4.0,  // A remains A
      "B": 3.0,  // B becomes B on 4.0 scale
      "C": 2.0,  // C becomes C on 4.0 scale
      "D": 1.0,  // D becomes D on 4.0 scale
      "E": 0.0,  // E becomes F on 4.0 scale
      "F": 0.0   // F remains F
    }
  }

  const gradeOptions = ["A", "B", "C", "D", "E", "F"]

  // Add new course
  const addCourse = () => {
    const newCourse: Course = {
      id: Date.now().toString(),
      code: "",
      grade: "",
      creditHours: 3
    }
    setCourses([...courses, newCourse])
  }

  // Remove course
  const removeCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id))
  }

  // Update course
  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, [field]: value } : course
    ))
  }

  // Check for duplicate course codes
  const getDuplicateCourses = () => {
    const courseCodes = courses.map(course => course.code.trim().toLowerCase()).filter(code => code !== "");
    const duplicates = courseCodes.filter((code, index) => courseCodes.indexOf(code) !== index);
    return [...new Set(duplicates)];
  }

  // Calculate CGPA
  const calculateCGPA = () => {
    if (courses.length === 0) {
      setCgpa(0)
      return
    }

    const validCourses = courses.filter(course => 
      course.code.trim() !== "" && course.grade !== "" && course.creditHours > 0
    )

    if (validCourses.length === 0) {
      setCgpa(0)
      return
    }

    let totalPoints = 0
    let totalCredits = 0

    validCourses.forEach(course => {
      const points = gradePoints[scale][course.grade as keyof typeof gradePoints[typeof scale]] || 0
      totalPoints += points * course.creditHours
      totalCredits += course.creditHours
    })

    const calculatedCGPA = totalCredits > 0 ? totalPoints / totalCredits : 0
    setCgpa(Math.round(calculatedCGPA * 100) / 100)
  }

  // Save data as JSON and download
  const downloadData = () => {
    const dataToSave: SavedData = {
      courses,
      scale,
      lastUpdated: new Date().toISOString()
    }

    const dataStr = JSON.stringify(dataToSave, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `cgpa-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Data Downloaded",
      description: "Your CGPA data has been saved successfully.",
    })
  }

  // Load data from JSON file
  const loadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid JSON file.",
        variant: "destructive"
      })
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const data: SavedData = JSON.parse(result)
        
        if (!data.courses || !Array.isArray(data.courses)) {
          throw new Error("Invalid file format: courses array not found")
        }

        // Validate course structure
        const validCourses = data.courses.filter(course => 
          course.id && course.code !== undefined && course.grade !== undefined && course.creditHours > 0
        )

        if (validCourses.length === 0) {
          throw new Error("No valid courses found in file")
        }

        setCourses(validCourses)
        setScale(data.scale || "5.0")
        toast({
          title: "Data Loaded Successfully",
          description: `Loaded ${validCourses.length} courses from ${new Date(data.lastUpdated).toLocaleDateString()}`,
        })
      } catch (error) {
        toast({
          title: "Error Loading File",
          description: error instanceof Error ? error.message : "Failed to load data. Please check the file format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  // Generate PDF transcript
  const generatePDF = () => {
    if (courses.length === 0) {
      toast({
        title: "No Data",
        description: "Please add some courses before generating PDF.",
        variant: "destructive"
      })
      return
    }

    const validCourses = courses.filter(course => 
      course.code.trim() !== "" && course.grade !== "" && course.creditHours > 0
    )

    if (validCourses.length === 0) {
      toast({
        title: "No Valid Courses",
        description: "Please complete at least one course before generating PDF.",
        variant: "destructive"
      })
      return
    }

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('UNIVERSITY OF LAGOS', 105, 20, { align: 'center' })
    
    doc.setFontSize(16)
    doc.text('ACADEMIC TRANSCRIPT', 105, 30, { align: 'center' })
    
    // Document info section
    const currentDate = new Date().toLocaleDateString()
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${currentDate}`, 20, 50)
    doc.text(`Total Courses: ${validCourses.length}`, 20, 60)
    doc.text(`Total Credits: ${validCourses.reduce((sum, course) => sum + course.creditHours, 0)}`, 20, 70)
    
    // CGPA Display
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CUMULATIVE GRADE POINT AVERAGE (CGPA)', 20, 85)
    doc.line(20, 87, 190, 87)
    
    doc.setFontSize(16)
    doc.text(`CGPA: ${cgpa.toFixed(2)} / ${scale}`, 20, 100)
    
    if (scale === "5.0") {
      const cgpa4Scale = validCourses.reduce((total, course) => {
        const points = gradePoints["4.0"][course.grade as keyof typeof gradePoints["4.0"]] || 0
        return total + (points * course.creditHours)
      }, 0) / validCourses.reduce((sum, course) => sum + course.creditHours, 0)
      
      doc.setFontSize(12)
      doc.text(`Equivalent 4.0 Scale: ${cgpa4Scale.toFixed(2)} / 4.0`, 20, 110)
    }
    
    // Course table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COURSE DETAILS', 20, 125)
    doc.line(20, 127, 190, 127)
    
    // Prepare table data
    const tableData = validCourses.map((course, index) => [
      (index + 1).toString(),
      course.code,
      course.grade,
      course.creditHours.toString(),
      gradePoints[scale][course.grade as keyof typeof gradePoints[typeof scale]].toFixed(1),
      (gradePoints[scale][course.grade as keyof typeof gradePoints[typeof scale]] * course.creditHours).toFixed(1)
    ])
    
    // Add totals row
    const totalCredits = validCourses.reduce((sum, course) => sum + course.creditHours, 0)
    const totalPoints = validCourses.reduce((sum, course) => 
      sum + (gradePoints[scale][course.grade as keyof typeof gradePoints[typeof scale]] * course.creditHours), 0
    )
    
    tableData.push([
      '',
      'TOTAL',
      '',
      totalCredits.toString(),
      '',
      totalPoints.toFixed(1)
    ])
    
    // Generate table
    ;(doc as any).autoTable({
      startY: 135,
      head: [['S/N', 'Course Code', 'Grade', 'Credit Hours', 'Grade Points', 'Quality Points']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        cellPadding: 3,
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 30 }
      }
    })
    
    // Grade scale legend
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('GRADING SCALE:', 20, finalY)
    
    doc.setFont('helvetica', 'normal')
    const gradeScale = [
      'A = 5.0 (Excellent)',
      'B = 4.0 (Very Good)', 
      'C = 3.0 (Good)',
      'D = 2.0 (Fair)',
      'E = 1.0 (Pass)',
      'F = 0.0 (Fail)'
    ]
    
    gradeScale.forEach((grade, index) => {
      doc.text(grade, 20, finalY + 10 + (index * 8))
    })
    
    // Class of degree guide
    doc.text('CLASS OF DEGREE GUIDE:', 110, finalY)
    const degreeClass = [
      'First Class: 4.50 - 5.00',
      'Second Class Upper: 3.50 - 4.49',
      'Second Class Lower: 2.40 - 3.49', 
      'Third Class: 1.50 - 2.39',
      'Pass: 1.00 - 1.49'
    ]
    
    degreeClass.forEach((cls, index) => {
      doc.text(cls, 110, finalY + 10 + (index * 8))
    })
    
    // Footer
    doc.setFontSize(8)
    doc.text('This is a computer-generated transcript from UNILAG CGPA Calculator', 105, 280, { align: 'center' })
    
    // Save PDF
    doc.save(`UNILAG_Transcript_${new Date().toISOString().split('T')[0]}.pdf`)
    
    toast({
      title: "PDF Generated",
      description: "Your academic transcript has been downloaded successfully.",
    })
  }

  // Calculate CGPA whenever courses or scale changes
  useEffect(() => {
    calculateCGPA()
  }, [courses, scale])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">UNILAG CGPA Calculator</h1>
          <p className="text-gray-600">Calculate your UNILAG CGPA and see 4.0 scale conversion</p>
        </div>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="data-management">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            {/* CGPA Display */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Current CGPA</CardTitle>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {cgpa.toFixed(2)} / {scale}
                  </Badge>
                  <Select value={scale} onValueChange={(value: "4.0" | "5.0") => setScale(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5.0">UNILAG (5.0)</SelectItem>
                      <SelectItem value="4.0">Standard (4.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {/* Course Input */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Course Grades</CardTitle>
                  <CardDescription>Add your UNILAG courses and grades (A=5.0, B=4.0, C=3.0, D=2.0, E=1.0, F=0)</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const duplicates = getDuplicateCourses();
                  return duplicates.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> Duplicate course codes detected: {duplicates.join(', ')}
                      </p>
                    </div>
                  );
                })()}
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No courses added yet. Click "Add Course" to get started.</p>
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor={`code-${course.id}`}>Course Code</Label>
                        <Input
                          id={`code-${course.id}`}
                          placeholder="e.g., CS101"
                          value={course.code}
                          onChange={(e) => updateCourse(course.id, 'code', e.target.value.toUpperCase())}
                          className={getDuplicateCourses().includes(course.code.trim().toLowerCase()) ? "border-yellow-400" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`grade-${course.id}`}>Grade</Label>
                        <Select
                          value={course.grade}
                          onValueChange={(value) => updateCourse(course.id, 'grade', value)}
                        >
                          <SelectTrigger id={`grade-${course.id}`}>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade} ({gradePoints[scale][grade as keyof typeof gradePoints[typeof scale]]})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`credits-${course.id}`}>Credit Hours</Label>
                        <Input
                          id={`credits-${course.id}`}
                          type="number"
                          min="1"
                          max="6"
                          value={course.creditHours}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            updateCourse(course.id, 'creditHours', Math.max(1, Math.min(6, value)));
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Add Course button moved to bottom */}
                <div className="flex justify-center pt-4">
                  <Button onClick={addCourse} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
                      <p className="text-sm text-gray-600">Total Courses</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {courses.filter(c => c.code.trim() !== "" && c.grade !== "").length}
                      </p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {courses.reduce((sum, course) => sum + (course.creditHours || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Credits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{cgpa.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">CGPA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data-management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Save your progress and load previous data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Download Data</Label>
                    <Button onClick={downloadData} className="w-full flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download JSON
                    </Button>
                    <p className="text-sm text-gray-600">
                      Save your current progress as a JSON file
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Load Data</Label>
                    <div className="relative">
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        onChange={loadData}
                        className="hidden"
                      />
                      <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Load JSON
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Load previously saved data from a JSON file
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Generate Transcript</Label>
                    <Button 
                      onClick={generatePDF} 
                      className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      disabled={courses.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <p className="text-sm text-gray-600">
                      Generate a formatted academic transcript
                    </p>
                  </div>
                </div>
                
                {courses.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Current Data Preview:</h4>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify({ courses: courses.slice(0, 2), scale, totalCourses: courses.length }, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
