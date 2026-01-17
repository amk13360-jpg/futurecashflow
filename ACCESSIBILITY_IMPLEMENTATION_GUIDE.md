# SCF Platform - UI/UX Enhancement: Accessibility & Implementation Guide

## 🎯 Quick Start

This guide helps developers properly implement the UI/UX enhancements while maintaining WCAG 2.1 AA compliance.

---

## ♿ Accessibility Standards

### What We Maintain
- **WCAG 2.1 AA Compliance**: All components meet or exceed level AA standards
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Always visible, minimum 3px ring with proper offset
- **Keyboard Navigation**: All interactive elements fully keyboard accessible
- **Screen Reader Support**: Proper semantic HTML and ARIA labels

### What We Enhanced
- Focus visibility (better ring styling and shadows)
- Error message clarity (with icons and better visual hierarchy)
- Status indicators (consistent messaging system)
- Loading states (visual feedback for async operations)
- Empty states (improved clarity and affordance)

---

## 📋 Implementation Checklist

### When Adding New Forms

- [ ] Use `FormLabel` with `required` prop for required fields
- [ ] Always include `FormDescription` for helper text
- [ ] Use `FormMessage` for error display
- [ ] Include `FormControl` for proper aria-describedby linking
- [ ] Test with keyboard navigation (Tab key)
- [ ] Verify focus outline is visible

**Example**:
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'

<FormField
  control={form.control}
  name="supplierName"
  render={({ field }) => (
    <FormItem>
      <FormLabel required>Supplier Name</FormLabel>
      <FormControl>
        <Input placeholder="Enter supplier name" {...field} />
      </FormControl>
      <FormDescription>This will appear on invoices</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### When Showing Feedback Messages

- [ ] Use `FeedbackBanner` for system messages
- [ ] Set `type` appropriately (success, error, warning, info)
- [ ] Include descriptive message and optional title
- [ ] Use `dismissible={true}` for non-critical messages
- [ ] Keep errors visible (dismissible={false} recommended)
- [ ] Test with screen reader

**Example**:
```tsx
import { FeedbackBanner } from '@/components/ui/feedback-banner'

{showSuccessMessage && (
  <FeedbackBanner
    type="success"
    title="Success"
    message="Supplier has been approved"
    dismissible={true}
  />
)}

{error && (
  <FeedbackBanner
    type="error"
    title="Validation Error"
    message={error}
    description="Please correct the highlighted fields"
    dismissible={false}
  />
)}
```

### When Adding Loading States

- [ ] Show spinner during async operations
- [ ] Include descriptive message if operation takes >1 second
- [ ] Disable buttons/inputs while loading
- [ ] Use `LoadingButton` for button loading states
- [ ] Use `LoadingOverlay` for page/section loading

**Example**:
```tsx
import { LoadingButton } from '@/components/ui/loading-states'

<LoadingButton
  isLoading={isSubmitting}
  disabled={!isValid}
>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</LoadingButton>
```

### When Creating Tables

- [ ] Use semantic `<table>` structure
- [ ] Add proper `TableHeader`, `TableBody`, `TableRow`
- [ ] Use consistent `TableHead` styling (uppercase headers)
- [ ] Implement row hover states for interactivity
- [ ] Make actions visible on hover or always visible
- [ ] Test with screen reader (verify table structure)

**Best Practices**:
- Headers should be clear and concise
- Row heights should be at least 44px (mobile accessibility)
- Actions should be obvious and consistent
- Consider zebra striping if many rows

### When Building Lists/Grids

- [ ] Use semantic `<ul>` or `<ol>` for lists
- [ ] Apply consistent spacing (gap-3 or gap-4)
- [ ] Ensure touch targets are at least 44x44px
- [ ] Highlight interactive elements on hover
- [ ] Make selection states obvious
- [ ] Group related items visually

---

## 🎨 Component Best Practices

### Buttons
```tsx
// ✅ GOOD: Clear intent, proper size
<Button variant="default" size="md">
  Save Changes
</Button>

// ❌ AVOID: Unclear action
<Button>Click</Button>

// ✅ GOOD: Loading state shown
<Button disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Forms
```tsx
// ✅ GOOD: All form elements properly labeled
<FormItem>
  <FormLabel required>Email</FormLabel>
  <FormControl>
    <Input type="email" />
  </FormControl>
  <FormDescription>We'll never share your email</FormDescription>
  <FormMessage />
</FormItem>

// ❌ AVOID: Missing labels
<Input placeholder="Email" />
```

### Feedback
```tsx
// ✅ GOOD: Clear, dismissible, auto-focused
<FeedbackBanner
  type="success"
  title="Saved"
  message="Your changes have been saved"
  dismissible={true}
/>

// ✅ GOOD: Error with detail
<FeedbackBanner
  type="error"
  title="Validation Failed"
  message="Please correct the errors below"
  description="Check supplier name and VAT number"
/>
```

---

## 🔍 Testing Guidelines

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab moves backward
- [ ] Enter activates buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys work in lists/select
- [ ] Focus order is logical

#### Visual Testing
- [ ] Focus indicators are always visible
- [ ] Hover states are clear
- [ ] Error states are obvious
- [ ] Success states are clear
- [ ] All text is readable (contrast)
- [ ] Spacing is consistent

#### Screen Reader Testing (NVDA/JAWS)
- [ ] Buttons have descriptive labels
- [ ] Form fields are labeled properly
- [ ] Errors are announced
- [ ] Success messages are announced
- [ ] Table structure is correct
- [ ] List items are announced correctly

#### Mobile Testing
- [ ] Touch targets are at least 44x44px
- [ ] Forms are easy to fill
- [ ] Buttons are easy to tap
- [ ] No horizontal scroll
- [ ] Text is readable without zoom

### Automated Testing Tools
- **axe DevTools**: Browser extension for WCAG violations
- **Lighthouse**: Chrome DevTools for accessibility audit
- **WAVE**: WebAIM tool for visual feedback
- **Color Contrast Checker**: Verify contrast ratios

---

## 🚨 Common Issues & Solutions

### Issue: Focus indicator not visible
**Solution**: Check that `focus-visible:ring-[3px]` is not being overridden
```css
/* ✅ Correct */
.button {
  outline: none;
  focus-visible: ring-ring/50 ring-[3px];
}

/* ❌ Wrong */
.button {
  outline: none;
  &:focus { background-color: blue; } /* No ring shown */
}
```

### Issue: Error message not announced
**Solution**: Use proper ARIA attributes
```tsx
// ✅ Correct
<input aria-invalid={!!error} aria-describedby="error-message" />
<span id="error-message" role="alert">{error}</span>

// ❌ Wrong
<input />
<span>{error}</span>
```

### Issue: Loading state not clear
**Solution**: Include visual AND textual feedback
```tsx
// ✅ Correct
<Button disabled>
  <Spinner /> Saving...
</Button>

// ❌ Weak
<Button disabled>Save</Button>
```

### Issue: Table not accessible
**Solution**: Use semantic markup
```tsx
// ✅ Correct
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* rows */}
  </TableBody>
</Table>

// ❌ Wrong
<div role="table">
  <div role="row">
    <span>Name</span>
  </div>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md-lg)
- **Desktop**: > 1024px (lg+)

### Implementation
```tsx
// Use Tailwind responsive classes
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Components automatically stack on mobile */}
</div>

// Show/hide based on viewport
<button className="hidden sm:inline-flex">
  Full Label
</button>
<button className="sm:hidden">
  Abbr
</button>
```

### Touch Targets
- Minimum 44x44px for all interactive elements
- Minimum 8px spacing between touch targets
- Use `size="sm"` for compact layouts

---

## 🌙 Dark Mode

All components support dark mode with `dark:` prefix classes. Testing checklist:
- [ ] Enable dark mode in browser DevTools
- [ ] Verify all text is readable
- [ ] Check color contrast ratios
- [ ] Verify images/icons are visible
- [ ] Test form inputs
- [ ] Check focus indicators

---

## 🎬 Animation Guidelines

### When to Use Animations
- ✅ State changes (active, hover, focus)
- ✅ Page transitions
- ✅ Loading indicators
- ✅ Success/error messages appearing

### When NOT to Use Animations
- ❌ Excessive (> 500ms per animation)
- ❌ Distracting on every interaction
- ❌ Causing motion sickness (parallax, fast-spinning)
- ❌ Forced (respect `prefers-reduced-motion`)

### Code Pattern
```tsx
// ✅ Correct: Respects user preferences
import { cn } from '@/lib/utils'

const className = cn(
  'transition-all duration-200',
  'motion-safe:animate-in',
  'motion-reduce:transition-none'
)

// Or use Tailwind's built-in support
<div className="animate-in fade-in slide-in-from-top-2" />
```

---

## 📊 Performance Considerations

- Use `transition-all duration-200` for smooth, not sluggish, effects
- Avoid `transition-all` on many properties; be specific
- Use `will-change` sparingly (3-4 elements maximum)
- Test on low-end devices
- Profile with Chrome DevTools Performance tab

---

## 🔗 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)
- [Tailwind Accessibility](https://tailwindcss.com/docs/responsive-design#accessibility)
- [Radix UI Documentation](https://www.radix-ui.com/)

---

## ✅ Verification Checklist

Before deploying UI changes:

**Code Review**
- [ ] All new components follow established patterns
- [ ] Required props are documented
- [ ] TypeScript types are correct
- [ ] Comments explain non-obvious code

**Accessibility Review**
- [ ] axe DevTools shows no violations
- [ ] Lighthouse score > 90
- [ ] Manual keyboard navigation works
- [ ] Screen reader test passed

**Visual Review**
- [ ] Light and dark modes look good
- [ ] Responsive breakpoints work
- [ ] Hover/focus/active states clear
- [ ] Consistency across similar components

**Testing**
- [ ] Unit tests pass
- [ ] Component tests pass
- [ ] E2E tests pass
- [ ] No console warnings

---

**Last Updated**: January 17, 2026  
**Status**: Ready for Production  
**Maintained By**: SCF Platform Team
