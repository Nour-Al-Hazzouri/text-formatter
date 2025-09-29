import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Textarea,
  Checkbox,
  Badge,
  Heading,
  Paragraph,
  LoadingSpinner,
  ProcessingIndicator,
  PaperSkeleton
} from '@/components/ui';
import { PenTool, Send, FileText } from 'lucide-react';

export default function UITestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <Heading size="h1" className="mb-4">UI Components Showcase</Heading>
          <Paragraph size="lg" variant="muted">
            Modern orange-themed components with paper texture aesthetics
          </Paragraph>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Various button styles with modern orange theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link Button</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <PenTool />
              </Button>
              <Button>
                <Send />
                With Icon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Components */}
        <Card>
          <CardHeader>
            <CardTitle>Input Components</CardTitle>
            <CardDescription>Form inputs with paper texture styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Enter text here..." />
            <Textarea placeholder="Write your notes here..." className="min-h-24" />
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-sm font-content text-orange-900">
                I agree to the terms and conditions
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Components</CardTitle>
            <CardDescription>Handwritten and serif font combinations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Heading size="h1" style="handwritten">Handwritten Heading</Heading>
            <Heading size="h2" style="clean">Clean Heading</Heading>
            <Heading size="h3" style="serif">Serif Heading</Heading>
            <Paragraph>
              This is a regular paragraph with the content font family, designed for optimal readability.
            </Paragraph>
            <Paragraph variant="muted">
              This is a muted paragraph with subtle coloring.
            </Paragraph>
            <Paragraph variant="subtle">
              This is a subtle paragraph with even lighter coloring.
            </Paragraph>
          </CardContent>
        </Card>

        {/* Loading Components */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Components</CardTitle>
            <CardDescription>Pen and pencil themed loading indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-8 items-center">
              <LoadingSpinner variant="pen" size="sm" />
              <LoadingSpinner variant="pencil" size="md" />
              <LoadingSpinner variant="spinner" size="lg" />
              <LoadingSpinner variant="dots" size="xl" />
            </div>
            
            <div className="space-y-4">
              <ProcessingIndicator progress={75} text="Processing your text..." />
            </div>

            <div>
              <Heading size="h4" className="mb-4">Skeleton Loading</Heading>
              <PaperSkeleton lines={4} showTitle={true} />
            </div>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <CardTitle>Meeting Notes</CardTitle>
              </div>
              <CardDescription>
                Extract attendees, agenda items, and action items from your meeting notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Popular</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Lists</CardTitle>
              <CardDescription>
                Convert plain text into organized todo lists with priorities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal Notes</CardTitle>
              <CardDescription>
                Structure your thoughts and insights into readable format.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Test with notebook styling */}
        <div className="notebook-paper notebook-shadow p-8 rounded-lg notebook-torn-top">
          <div className="notebook-binding w-8 h-full absolute left-0 top-0 rounded-l-lg"></div>
          <div className="ml-12">
            <Heading size="h3" style="handwritten" className="mb-4">
              Notebook Style Test
            </Heading>
            <Paragraph className="mb-4">
              This card demonstrates the notebook paper texture with binding and torn edge effects.
            </Paragraph>
            <div className="space-y-2">
              <Input placeholder="Type in a notebook..." />
              <Button variant="secondary">Save Note</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
