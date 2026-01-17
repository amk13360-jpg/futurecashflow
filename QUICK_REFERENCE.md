# SCF Platform UI/UX - Quick Reference Guide

## 🚀 Quick Start

### New Components Available

#### 1. FeedbackBanner (Feedback Messages)
```tsx
import { FeedbackBanner } from '@/components/ui/feedback-banner'

// Success
<FeedbackBanner type="success" message="Saved successfully" />

// Error
<FeedbackBanner type="error" title="Error" message="Something went wrong" />

// Warning
<FeedbackBanner type="warning" message="Are you sure?" />

// Info
<FeedbackBanner type="info" message="This is informational" />
```

#### 2. Loading States
```tsx
import { LoadingSpinner, LoadingButton, LoadingOverlay, SkeletonLoader } from '@/components/ui/loading-states'

// Spinner
<LoadingSpinner size="md" />

// Button with loading
<LoadingButton isLoading={isSubmitting}>Save</LoadingButton>

// Full overlay
<LoadingOverlay isLoading={isLoading} message="Processing...">
  <Content />
</LoadingOverlay>

// Placeholder skeleton
<SkeletonLoader count={3} height="h-12" />
```

---

## 📝 Enhanced Components

### Forms - Now Support Required Indicators
```tsx
<FormLabel required>Field Name</FormLabel>
```
Adds a red `*` automatically.

### Error Messages - Now Have Icons
```tsx
<FormMessage />
```
Now displays with warning icon and colored background.

### Tables - Better Spacing
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column Name</TableHead>
    </TableRow>
  </TableHeader>
</Table>
```
Headers now have uppercase styling, better spacing.

### Cards - Better Hover Effects
```tsx
<Card>
  {/* Now has hover shadow and border effects */}
</Card>
```

### Buttons - Better Feedback
```tsx
<Button>
  {/* Now has active:scale-95, better shadows */}
</Button>
```

---

## 🎨 Design Tokens (Unchanged - Preserved!)

### Colors
- Primary: `#3594F7` (Brand Blue)
- Success: `#27AE60` (Green)
- Warning: `#F2C94C` (Yellow)
- Destructive: `#FF4D4F` (Red)

### Spacing Scale
- 4px (0.25rem)
- 8px (0.5rem)
- 12px (0.75rem)
- 16px (1rem)
- 24px (1.5rem)
- 32px (2rem)

### Border Radius
- `rounded-md` (0.5rem) - Default
- `rounded-lg` (0.625rem) - Cards
- `rounded-xl` (0.75rem) - Larger components

---

## ✅ Implementation Checklist

### When Building Forms
- [ ] Use `FormLabel` with `required` prop
- [ ] Include `FormDescription` for helper text
- [ ] Let `FormMessage` show errors automatically
- [ ] Test keyboard navigation
- [ ] Verify focus outline visible

### When Showing Feedback
- [ ] Use `FeedbackBanner` for all system messages
- [ ] Match type to message (success, error, warning, info)
- [ ] Include descriptive message
- [ ] Make errors persistent (dismissible={false})

### When Adding Loading States
- [ ] Show spinner during async operations
- [ ] Include message if > 1 second
- [ ] Disable buttons while loading
- [ ] Use `LoadingButton` for simple cases

### When Building Tables
- [ ] Use semantic `Table` component
- [ ] Provide clear header labels
- [ ] Make row height at least 44px (mobile)
- [ ] Show actions on hover or always
- [ ] Test with screen reader

---

## 🎯 Common Patterns

### Save & Show Success
```tsx
const [showSuccess, setShowSuccess] = useState(false)

const handleSave = async () => {
  try {
    await saveChanages()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  } catch (error) {
    // Error shown in form
  }
}

return (
  <>
    {showSuccess && (
      <FeedbackBanner
        type="success"
        message="Changes saved successfully"
        dismissible={true}
      />
    )}
    <form onSubmit={handleSave}>
      {/* form fields */}
    </form>
  </>
)
```

### Form with Validation Feedback
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel required>Email</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormDescription>
        We'll use this for notifications
      </FormDescription>
      <FormMessage /> {/* Shows error if invalid */}
    </FormItem>
  )}
/>
```

### Loading Data in Table
```tsx
const [isLoading, setIsLoading] = useState(true)
const [data, setData] = useState([])

useEffect(() => {
  loadData()
}, [])

const loadData = async () => {
  try {
    setIsLoading(true)
    const result = await fetchData()
    setData(result)
  } finally {
    setIsLoading(false)
  }
}

return (
  <Card>
    {isLoading ? (
      <SkeletonLoader count={5} height="h-12" />
    ) : (
      <Table>
        {/* table content */}
      </Table>
    )}
  </Card>
)
```

---

## ♿ Accessibility Tips

### Keyboard Navigation
- Tab: Move to next element
- Shift+Tab: Move to previous
- Enter: Activate button
- Escape: Close dialog/menu
- Arrow Keys: Navigate lists

### Screen Reader
- All buttons have labels
- Form fields are labeled
- Errors are announced
- Status messages are announced

### Focus Indicators
- Always visible (3px blue ring)
- Offset from element (2px)
- Can't be disabled

---

## 📊 Component Matrix

| Component | Enhanced | New | Features |
|-----------|----------|-----|----------|
| FormLabel | ✅ | | Required indicators |
| FormMessage | ✅ | | Icons + styling |
| FormDescription | ✅ | | Better visibility |
| Input | ✅ | | Hover/focus states |
| Button | ✅ | | Scale feedback |
| Badge | ✅ | | Better spacing |
| Card | ✅ | | Hover effects |
| Table | ✅ | | Better spacing |
| MetricCard | ✅ | | Border accents |
| FeedbackBanner | | ✅ | 4 types |
| LoadingStates | | ✅ | Spinners + overlays |

---

## 🐛 Troubleshooting

### Focus outline not showing?
```tsx
// Check that these aren't being overridden
focus-visible:ring-[3px]
focus-visible:ring-ring/50
```

### Error message not displaying?
```tsx
// Make sure you have:
<FormMessage /> {/* Must be in FormItem */}
```

### Loading button keeps showing spinner?
```tsx
// Make sure to update isLoading state
const [isSubmitting, setIsSubmitting] = useState(false)
<LoadingButton isLoading={isSubmitting}>
```

### Table headers not styled?
```tsx
// Use TableHeader and TableHead components
<TableHeader>
  <TableRow>
    <TableHead>Column</TableHead>
  </TableRow>
</TableHeader>
```

---

## 📚 Full Documentation

For complete details, see:
1. **PROJECT_COMPLETION_SUMMARY.md** - Project overview
2. **UI_UX_ENHANCEMENTS.md** - Detailed enhancements
3. **ACCESSIBILITY_IMPLEMENTATION_GUIDE.md** - Implementation guide

---

## 🎨 Visual Reference

### Button States
```
Default:    Blue bg, white text, shadow
Hover:      Darker blue, larger shadow
Active:     Scaled down (95%), smaller shadow
Focus:      Blue ring outline + offset
Disabled:   Reduced opacity
```

### Form Error States
```
Input:      Red border on focus, shadow
Label:      Turns red
Message:    Red bg, icon, left border, animation
Helper:     Dims (less prominent)
```

### Table Row States
```
Normal:     White/gray bg
Hover:      Light blue accent bg
Selected:   Primary color (10% opacity)
Focus:      Blue outline ring
```

### Empty State
```
Icon:       Large (20x20), in colored box
Title:      Bold, larger font
Description: Muted text
Action:     Button below
```

---

## 🔗 Quick Links

- **Colors**: `tailwind.config.js` (lines 8-18)
- **Typography**: `app/globals.css` (lines 4-80)
- **Components**: `components/ui/`
- **Examples**: Component files have JSDoc examples

---

## ✨ Pro Tips

1. **Always use FormMessage** - It's smart, auto-shows errors
2. **Use FeedbackBanner for feedback** - Better than custom toasts
3. **Test keyboard navigation** - Tab through forms
4. **Dark mode works** - Test with `dark:` toggle
5. **Mobile first** - Use `md:` and `lg:` for responsive

---

**Version**: 1.0.0  
**Last Updated**: January 17, 2026  
**Status**: Production Ready ✅
