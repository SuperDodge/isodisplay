task-master parse-prd --input=requirements.txt**_Brand Colors_**
brand-gray-900: #252c3a; /_ Pantone 532 C _/
brand-orange-500: #f56600; /_ Bright Orange C _/
brand-blue-900: #08209a; /_ Dark Blue C _/
brand-blue-200: #c5e0ea; /_ Pantone 545 C _/

Color Usage:
Primary UI accent = --brand-orange-500.
Primary surface/background = white or --brand-gray-900 for dark sections.
Text on dark = white; text on light = --brand-gray-900.

**_Typography_**
H1: Made Tommy Bold
• Transform: All caps
• Tracking: +0.6em
• Line height: 1.2
• Use: Page titles, key section headers

    H2: Made Tommy Thin
    •	Transform: All caps
    •	Line height: 1.3
    •	Use: Section headings, sub-headers under H1

    H3: Metropolis Extra Bold
    •	Transform: All caps
    •	Tracking: +1.5em
    •	Line height: 1.4
    •	Use: Small section headers, callouts, navigation labels

    Body: Metropolis Regular
    •	Line height: 1.5–1.6
    •	Use: Paragraph text, long-form content

Typography Notes:
Preserve all‑caps in headings.
Keep tracking values in CSS letter‑spacing: H1 0.625rem/1000 ≈ 0.01em, H3 0.025em (adjust to match renders).

**_Logo_**
-Maintain clear space ≥ 0.5× logo height on all sides.
-Minimum size: 5 mm (raster/SVG scale accordingly).
-Use brand colors only.
-Do not rotate, stretch, distort, outline, add gradients, or shadows.
-Our logo should never have it's aspect ratio changed.

**_UI Standards_**
-Use toasts as detailed below to indicate success and failure anytime data is added, edited, modified or removed.
-Actions that need to be confirmed should be done through a confirmation modal as outlined below.
-Data validation issues should be realyed through an error modal as outlined below.
-For items that can be made active or inactive/closed please show badges on list and card items to indicate that status. Green badges for active and red badges for inactive/closed/etc.
-There should be one icon for each page that is used consistently throughout the UI. It should be used next to the text in menu items and displayed in an accent color next to the text for the header on the page.

Error Dialogs:
Visual Design:

- Background: Dark red/maroon gradient overlay with semi-transparent backdrop
- Container: Rounded rectangular modal with dark red background (#7f1d1d or similar)
- Border: Subtle darker red border or shadow for depth
- Size: Medium width modal, centered on screen
- Backdrop: Dark semi-transparent overlay covering the entire screen

Header Section:

- Icon: Warning triangle icon (⚠️) in orange/yellow color
- Title: "ERROR" text in white, bold, sans-serif font
- Layout: Icon and title aligned horizontally with small gap

Content Section:

- Text: should provide details on the error or confirmation
- Color: Light red/pink text for readability on dark background
- Font: Regular weight, readable size
- Spacing: Adequate padding around the message

Footer Section:

- Button: "OK" button on the right side
- Button Style:
  - Dark red background with subtle hover effect
  - White text
  - Rounded corners
  - Standard button padding
  - Cursor pointer on hover

Behavior:

- Modal: Blocks interaction with background content
- Dismiss: Clicking "OK" button closes the modal
- Focus: Button should be focusable and dismissible with Enter/Escape keys
- Animation: Subtle fade-in animation when appearing

Technical Implementation:

- Framework: React with shadcn/ui components (AlertDialog)
- Styling: Tailwind CSS classes
- Component Structure: AlertDialog > AlertDialogContent > Header + Description + Footer
- State Management: Controlled by boolean state variable
- Accessibility: Proper ARIA labels and keyboard navigation

Example Tailwind Classes:

- Container: `bg-red-500/20 backdrop-blur-md border-red-500/50 text-white`
- Header: `text-white flex items-center gap-2`
- Icon: `w-6 h-6 text-orange-500`
- Button: `bg-red-600/20 hover:bg-red-600/40 text-white`

Confirmation Dialogs:
Visual Design: - Background: Dark red/maroon gradient overlay with semi-transparent backdrop (same as error dialogs) - Container: Rounded rectangular modal with dark red background (#7f1d1d or similar) - Border: Subtle darker red border or shadow for depth - Size: Medium width modal (max-w-lg), centered on screen - Backdrop: Dark semi-transparent overlay covering the entire screen

    Header Section:
    - Icon: Warning triangle icon (⚠️) in orange/yellow color (text-orange-500)
    - Title: Destructive action text in Made Tommy Bold font, white, all caps
    - Layout: Icon and title aligned horizontally with small gap (gap-2)

    Content Section:
    - Text: Should provide details on the confirmation action
    - Color: Light red/pink text for readability on dark background (text-red-300)
    - Font: Metropolis Regular (font-body class)
    - Spacing: Adequate padding around the message (pt-2)

    Footer Section:
    - Buttons: "Cancel" button on left, destructive action button on right
    - Cancel Button Style:
      - Ghost variant with transparent background
      - White text with hover:bg-white/10 hover effect
      - White text maintained on hover (hover:text-white)
      - Font: Metropolis Regular (font-body)
    - Confirm Button Style:
      - Destructive variant (red background)
      - White text
      - Font: Metropolis Regular (font-body)

    Behavior:
    - Modal: Blocks interaction with background content
    - Dismiss: Clicking "Cancel" or "X" closes the modal
    - Confirm: Clicking destructive button executes action and closes modal
    - Focus: Buttons should be focusable and dismissible with Enter/Escape keys
    - Animation: Subtle fade-in/zoom animation when appearing

    Technical Implementation:
    - Framework: React with shadcn/ui components (AlertDialog - same as error dialogs)
    - Styling: Tailwind CSS classes with brand font override
    - Component Structure: AlertDialog > AlertDialogContent > AlertDialogHeader + AlertDialogDescription + AlertDialogFooter
    - State Management: Controlled by boolean state variable
    - Accessibility: Proper ARIA labels and keyboard navigation

    Typography Override Solution:
    - AlertDialogTitle component has default font-semibold that overrides brand fonts
    - Solution: Wrap title text in <span> with inline styles
    - Style: { fontFamily: 'Made Tommy, sans-serif', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.01em' }

    Example Tailwind Classes:
    - Container: `bg-red-500/20 backdrop-blur-md border-red-500/50 text-white`
    - Header: `flex items-center gap-2 text-white text-lg`
    - Icon: `w-6 h-6 text-orange-500`
    - Cancel Button: `variant="ghost" className="text-white hover:bg-white/10 hover:text-white font-body"`
    - Confirm Button: `variant="destructive" className="font-body"`
    - Description: `text-red-300 pt-2 font-body`

Success Toasts:
Visual Design:

- Background: Bright green gradient (#10b981 or #10b981E6 with opacity/blur)
- Container: Rounded rectangular toast with subtle shadow
- Size: Auto-width based on content, moderate height for single line text
- Border: Subtle darker green border or none
- Shadow: Soft drop shadow for elevation

Positioning:

- Location: Fixed position at top-center of viewport
- Offset: Positioned below any top navigation (approximately 96px from top)
- Z-index: High z-index (50+) to appear above other content
- Centering: Horizontally centered using transform: translateX(-50%)

Content Layout:

- Icon: Checkmark circle icon (✓) in white
- Text: should indicate what action was completed successfully
- Layout: Icon and text aligned horizontally with small gap
- Alignment: Items centered vertically within the toast

Typography:

- Color: White text for contrast
- Weight: Bold/semi-bold font weight
- Size: Medium readable size (14-16px)
- Font: Sans-serif system font

Behavior:

- Animation: Fade-in and slide-down animation when appearing
- Duration: Auto-dismiss after 4 seconds
- Timing: Smooth CSS transitions
- Non-blocking: Doesn't prevent interaction with page content
- Multiple: Can stack if multiple toasts appear

Technical Implementation:

- Framework: React component with conditional rendering
- State: Controlled by boolean state variable
- Styling: CSS-in-JS or Tailwind CSS classes
- Animation: CSS transitions or animation library

Example Tailwind Classes:

- Container: `fixed top-24 left-1/2 -translate-x-1/2 z-50`
- Background: `bg-green-500/90 backdrop-blur-md`
- Layout: `rounded-lg shadow-lg p-4 flex items-center gap-3`
- Text: `text-white font-bold`
- Animation: `animate-in fade-in slide-in-from-top`
- Icon: `w-6 h-6 text-white`

Interaction:

- Dismissal: Auto-dismisses, no manual close button
- Hover: Optional subtle hover effect
- Click: Optionally clickable to dismiss early

Failure Toasts:
Visual Design:

- Background: Bright red gradient (#ef4444 or #ef4444E6 with opacity/blur)
- Container: Rounded rectangular toast with subtle shadow
- Size: Auto-width based on content, moderate height for single line text
- Border: Subtle darker green border or none
- Shadow: Soft drop shadow for elevation

Positioning:

- Location: Fixed position at top-center of viewport
- Offset: Positioned below any top navigation (approximately 96px from top)
- Z-index: High z-index (50+) to appear above other content
- Centering: Horizontally centered using transform: translateX(-50%)

Content Layout:

- Icon: AlertTriangle ⚠️ or x circle icon (x) in white
- Text: should indicate what action failed
- Layout: Icon and text aligned horizontally with small gap
- Alignment: Items centered vertically within the toast

Typography:

- Color: White text for contrast
- Weight: Bold/semi-bold font weight
- Size: Medium readable size (14-16px)
- Font: Sans-serif system font

Behavior:

- Animation: Fade-in and slide-down animation when appearing
- Timing: Smooth CSS transitions
- Non-blocking: Doesn't prevent interaction with page content
- Multiple: Can stack if multiple toasts appear

Technical Implementation:

- Framework: React component with conditional rendering
- State: Controlled by boolean state variable
- Styling: CSS-in-JS or Tailwind CSS classes
- Animation: CSS transitions or animation library

Example Tailwind Classes:

- Container: `fixed top-24 left-1/2 -translate-x-1/2 z-50`
- Background: `bg-red-500/90 backdrop-blur-md`
- Layout: `rounded-lg shadow-lg p-4 flex items-center gap-3`
- Text: `text-white font-bold`
- Animation: `animate-in fade-in slide-in-from-top`
- Icon: `w-6 h-6 text-white`

Interaction:

- Dismissal: Must be manually dismissed by user
- Hover: Optional subtle hover effect
- Click: Optionally clickable to dismiss early

Visual Data Validation Feedback:
Visual Design:

- Input Field Borders: Invalid fields show red border with ring effect
- Error Message: Red warning text with AlertTriangle icon below invalid fields
- Color Scheme: Red borders (#ef4444) with red text (#fca5a5) for errors
- Icon: AlertTriangle from lucide-react, sized w-3 h-3
- Typography: text-sm size, flex layout with items-center and gap-1

Validation Behavior:

- Real-time: Validates as user types, not just on form submission
- Conditional Display: Error messages only appear when field has content AND is invalid
- State Management: Uses separate validation error state object for each form
- Error Clearing: Validation errors clear when field becomes valid or empty

Field-Specific Validation Rules:

- Contact Person: Must include both first and last name if provided
  - Error Message: "Must include both first and last name."
  - Validation: Checks for at least 2 words separated by whitespace
- Contact Email: Must be valid email format if provided
  - Error Message: "Enter a valid email address."
  - Validation: Standard email regex pattern
- Contact Phone: Must be 10-15 digits if provided
  - Error Message: "Enter a valid phone number (10-15 digits)."
  - Validation: Strips non-digits and checks length
  - Auto-formatting: Formats as user types (e.g., (555) 123-4567)

Technical Implementation:

- State: contactValidationErrors object with field names as keys
- Components: Uses shadcn/ui Input and Label components
- Styling: Tailwind CSS classes with conditional border colors
- Icons: AlertTriangle from lucide-react for error indicators
- Framework: React with useState for validation state management

CSS Classes:

- Valid Field: `bg-white/10 border-white/20 text-white`
- Invalid Field: `bg-white/10 text-white border-red-500 ring-1 ring-red-500/50 focus:ring-red-500/50`
- Error Message: `text-red-300 text-sm flex items-center gap-1`
- Error Icon: `w-3 h-3` (AlertTriangle)

Form Integration:

- Apply to all optional contact fields (contact_person, contact_email, contact_phone)
- Validate in handleChange function for real-time feedback
- Also validate in form submission (handleSave) for final check
- Clear validation errors when form state resets (e.g., client selection changes)
- Disable action buttons (Save/Create) when validation errors exist

Button State Management:

- Action buttons should prevent submission when any validation errors are present
- Implementation: Use manual click handling instead of `disabled` attribute to avoid browser cursor overrides
- Disabled button styling: `bg-gray-500` (grayed out appearance)
- Enabled button styling: `bg-orange-500 hover:bg-orange-600` (normal orange styling)
- Click Prevention: Use `onClick={(e) => { if (hasErrors) { e.preventDefault(); return; } handleSubmit(e); }}`
- Cursor Behavior: Use inline `style={{cursor: 'not-allowed'}}` for higher CSS specificity than classes
- Why inline styles: The `disabled` attribute causes browsers to override cursor styles, so we avoid it entirely
- Button text remains the same when disabled (e.g., "Create Client", "Save Changes")
- Cursor behavior: Shows "not-allowed" (🚫) symbol when hovering over disabled buttons
- Prevents form submission until all validation errors are resolved

Consistency Requirements:

- Use identical validation logic, error messages, and styling across all forms
- Maintain same visual appearance in both client and project modals
- Apply same pattern to any future forms with contact information fields

**_FilterableSelect Component Standards_**

All dropdown/select components throughout the application MUST use the FilterableSelect component instead of the default shadcn/ui Select component. This ensures consistent visual styling and search functionality across the entire application.

Component Location:

- File: `/src/components/ui/filterable-select.jsx`
- Import: `import { FilterableSelect } from '@/components/ui/filterable-select';`

Required Visual Standards:

- Background: 75% opacity brand gray (`rgba(37, 44, 58, 0.75)`) for dropdown content
- Trigger styling: Semi-transparent white background (`bg-white/10`) with 20% opacity white borders (`border-white/20`)
- Text color: White text for dark backgrounds (`text-white`)
- Placeholder text: 50% opacity white (`text-white/50`)
- Search functionality: Built-in real-time filtering with search icon
- Consistent height and padding with other form elements

Standard Implementation Pattern:

```jsx
<FilterableSelect
  value={currentValue}
  onValueChange={handleChange}
  options={dataArray.map((item) => ({
    value: item.id,
    label: item.name,
  }))}
  placeholder="Select item..."
  searchPlaceholder="Search items..."
  triggerClassName="bg-white/10 border-white/20 text-white"
  emptyMessage="No items found."
/>
```

Required Props:

- `value`: Current selected value
- `onValueChange`: Change handler function
- `options`: Array of objects with `value` and `label` properties
- `placeholder`: Placeholder text when no item selected
- `searchPlaceholder`: Placeholder text for search input
- `triggerClassName`: CSS classes for styling the dropdown trigger
- `emptyMessage`: Message shown when no options match search

Optional Props:

- `disabled`: Boolean to disable the dropdown (default: false)
- `className`: Additional CSS classes for the dropdown content

Standard Trigger Styling Classes:

- Basic: `"bg-white/10 border-white/20 text-white"`
- With hover: `"bg-white/10 border-white/20 text-white hover:border-white/30 transition-colors duration-200"`
- With custom width: `"bg-white/10 border-white/20 text-white w-48"` (adjust width as needed)
- For small text: `"bg-white/10 border-white/20 text-white text-sm w-full"`
- When disabled: Use conditional styling with opacity-50 and cursor-not-allowed

Disabled State Implementation:

- Set `disabled={true}` prop
- Use conditional triggerClassName:
  ```jsx
  triggerClassName={`bg-white/10 border-white/20 text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  ```

Data Transformation Examples:

```jsx
// Simple array of objects
options={users.map(user => ({
  value: user.id,
  label: user.display_name || user.full_name
}))}

// With "All" option
options={[
  { value: 'all', label: 'All Items' },
  ...items.map(item => ({
    value: item.id,
    label: item.name
  }))
]}

// Complex value (multiple IDs)
options={clients.map(client => ({
  value: client.allIds.join(','),
  label: client.name
}))}
```

Converted Components (Reference):

1. ProjectDetails.jsx: Client, Project Manager, Rate Sheet, Phase dropdowns
2. Users.jsx: Role, Job Function, Discipline dropdowns
3. UserList.jsx: Discipline, Job Function, Role dropdowns (with disabled state)
4. ProjectFilters.jsx: Status, Client filter dropdowns
5. MyProjects.jsx: Project Manager filter dropdown

DO NOT USE:

- Default shadcn/ui Select component
- Native HTML select elements
- Any other dropdown components

Migration Notes:

- Replace `<Select>` with `<FilterableSelect>`
- Convert `<SelectItem>` children to `options` array prop
- Update `triggerClassName` to match standards
- Remove unused Select imports: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }`
- Keep only: `import { FilterableSelect } from '@/components/ui/filterable-select';`

All new dropdown implementations must follow these standards to maintain visual consistency and user experience across the application.

**_Tabbed Interface Standards_**

All tabbed interfaces throughout the application MUST use the enhanced shadcn/ui Tabs component with consistent folder tab styling and visual hierarchy.

Component Location:

- File: `/src/components/ui/tabs.jsx`
- Import: `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';`

Visual Design Standards:

- **Folder Tab Appearance**: Tabs appear as physical folder tabs that connect seamlessly to content
- **Enhanced Borders**: 25% opacity white borders with progressive enhancement on hover/active states
- **Glass Morphism**: Backdrop blur effects with semi-transparent backgrounds
- **Shadow Effects**: Subtle shadows that increase on interaction for depth perception
- **Square Top Corners**: Content cards use `rounded-t-none` to create seamless connection with tabs

Tab State Styling:

- **Default State**: `bg-black/20 backdrop-blur-sm border-white/25 text-white/60 shadow-sm`
- **Hover State**: `hover:bg-white/10 hover:backdrop-blur-md hover:border-white/30 hover:text-white/90 hover:shadow-md`
- **Active State**: `bg-orange-500/90 backdrop-blur-md border-orange-500/40 text-white shadow-lg shadow-orange-500/25`

Required Implementation Pattern - Folder Tab Structure:

```jsx
{
  /* Tabs outside Card container for folder effect */
}
<Tabs defaultValue="tab1">
  <TabsList className="w-full">
    <TabsTrigger value="tab1">Tab 1 Title</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2 Title</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">
    <Card className="glass-card border-0 hover:bg-white/10 transition-all duration-200 rounded-t-none">
      <CardContent className="p-6">{/* Tab 1 content */}</CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="tab2">
    <Card className="glass-card border-0 hover:bg-white/10 transition-all duration-200 rounded-t-none">
      <CardContent className="p-6">{/* Tab 2 content */}</CardContent>
    </Card>
  </TabsContent>
</Tabs>;
```

Key Implementation Requirements:

1. **Folder Structure**: Tabs component wraps everything, not contained within Cards
2. **Square Content Corners**: Always use `rounded-t-none` on content Cards
3. **Consistent Card Styling**: Use `glass-card border-0 hover:bg-white/10 transition-all duration-200`
4. **Standard TabsList**: Use `className="w-full"` only, no grid layouts
5. **Clean TabsTrigger**: No custom classes on triggers - rely on base component styling

Visual Hierarchy:

- **Tab Borders**: Progressive opacity (25% → 30% → 40%) for default → hover → active
- **Tab Shadows**: Increasing shadow depth (sm → md → lg) for interaction feedback
- **Background Blur**: Enhanced blur on hover and active states for premium feel
- **Color Progression**: Subtle grayscale to vibrant orange for active state

Converted Implementation Examples:

1. **ProjectDashboard.jsx**: WBS Summary / Team Hours Summary tabs
2. **MyProjects.jsx**: Active Projects / Closed Projects / Analytics tabs
3. **TimeEntry.jsx**: Current Week / Add Rows / Previous Weeks tabs
4. **ProjectDetailDashboard.jsx**: WBS Summary / Team Hours Summary tabs

DO NOT USE:

- Tabs inside Card components (old pattern)
- Grid layouts on TabsList (`grid w-full grid-cols-3`)
- Custom background classes on TabsList (`bg-white/10`, `glass-card`)
- Custom styling on individual TabsTrigger components
- Rounded top corners on content Cards

Migration Notes:

- Move Tabs component outside Card containers
- Add `rounded-t-none` to all content Cards
- Remove grid classes from TabsList
- Remove custom styling from TabsTrigger components
- Ensure seamless visual connection between tabs and content

All new tabbed interfaces must follow these standards to maintain the sophisticated folder tab aesthetic and consistent user experience across the application.

**_Custom Scrollbar Standards_**

All scrollable elements throughout the application MUST use consistent custom scrollbar styling that matches the app's dark theme and glass-morphism design.

Scrollbar Classes Available:

- File: `/src/styles/brand.css`
- Import: Custom scrollbar classes are globally available

Visual Design Standards:

- **Orange Accent Scrollbar** (`custom-scrollbar`): Primary scrollbar for modals, overlays, and main content areas
- **Dark Scrollbar** (`dark-scrollbar`): Alternative scrollbar for content areas with darker backgrounds
- **Consistent Dimensions**: 8px width/height with 4px border radius
- **Brand Colors**: Uses brand orange (`--brand-orange-500`) and brand gray (`--brand-gray-900`)
- **Transparency Effects**: Semi-transparent backgrounds with opacity variations on hover

Primary Scrollbar (custom-scrollbar):

- **Track**: `rgba(255, 255, 255, 0.1)` background with 4px border radius
- **Thumb**: `rgba(245, 102, 0, 0.6)` (brand orange at 60% opacity)
- **Thumb Hover**: `rgba(245, 102, 0, 0.8)` (brand orange at 80% opacity)
- **Border**: `1px solid rgba(255, 255, 255, 0.1)` for definition
- **Firefox Support**: `scrollbar-width: thin` with matching colors

Alternative Dark Scrollbar (dark-scrollbar):

- **Track**: `rgba(37, 44, 58, 0.5)` (brand gray at 50% opacity)
- **Thumb**: `rgba(255, 255, 255, 0.3)` (white at 30% opacity)
- **Thumb Hover**: `rgba(255, 255, 255, 0.5)` (white at 50% opacity)
- **Border**: `1px solid rgba(255, 255, 255, 0.1)` for subtle definition

Standard Implementation:

```html
<!-- For modals, dialogs, and primary scrollable content -->
<div className="overflow-y-auto custom-scrollbar">{/* Scrollable content */}</div>

<!-- For content areas with darker backgrounds -->
<div className="overflow-y-auto dark-scrollbar">{/* Scrollable content */}</div>

<!-- For horizontal scrolling -->
<div className="overflow-x-auto custom-scrollbar">{/* Horizontally scrollable content */}</div>
```

Browser Support:

- **Webkit browsers** (Chrome, Safari, Edge): Full styling with `::-webkit-scrollbar` pseudo-elements
- **Firefox**: Uses `scrollbar-width: thin` and `scrollbar-color` properties
- **Consistent appearance**: All browsers display themed scrollbars matching the app design

Usage Guidelines:

1. **Always use custom scrollbar classes** on any element with `overflow-auto` or `overflow-scroll`
2. **Choose appropriate variant**: Use `custom-scrollbar` for most cases, `dark-scrollbar` for darker content areas
3. **Apply to containers**: Add class to the scrolling container, not the content inside
4. **Test on all browsers**: Verify appearance in Chrome, Firefox, Safari, and Edge
5. **Maintain consistency**: Use same scrollbar style across similar components

Required Implementation:

- All modals and dialogs with scrolling content
- Data tables with horizontal/vertical scrolling
- Sidebar navigation with overflow content
- Form containers with scrollable content
- Any custom scrollable components

DO NOT USE:

- Default browser scrollbars (without custom styling)
- Inline scrollbar styles
- Different scrollbar styling that doesn't match brand colors
- Scrollbars without proper hover states

Converted Components (Reference):

1. Projects.jsx: Create Project modal (`DialogContent` with `custom-scrollbar`)
2. All future scrollable modals should follow this pattern
3. Data tables and lists should use appropriate scrollbar class
4. Form containers with overflow should include custom scrollbar styling

All new scrollable elements must follow these standards to maintain visual consistency and professional appearance across the application.

**_Progress Bar Standards_**

All progress bars throughout the application MUST use consistent conditional formatting that provides clear visual indicators for caution and alert states. This ensures users can quickly identify elements requiring attention across different contexts.

Visual Design Standards:

- **Contextual Colors**: Progress bars use different base colors depending on their data type and context
- **Universal Conditional States**: All progress bars implement yellow (caution) and red (alert) conditional formatting
- **Consistent Thresholds**: Default caution at 90%, alert at >100% (customizable per context)
- **Smooth Transitions**: Color changes provide clear progression from normal → caution → alert states

Base Color Usage:

- **Green (`bg-green-500`)**: Financial/dollar amounts (money is green)
- **Orange (`bg-orange-500`)**: Hours, time-based, and general progress (brand accent color)
- **Contextual Colors**: Other colors for specific data types (billable %, non-billable %, etc.)

Conditional Formatting Logic:

- **Normal State**: Uses appropriate base color (green, orange, etc.)
- **Caution State**: Yellow (`bg-yellow-500`) when approaching threshold (typically ≥90%)
- **Alert State**: Red (`bg-red-500`) when exceeding threshold (typically >100%)

Standard Implementation Pattern:

```jsx
<Progress
  value={percentageValue}
  className={`h-2 bg-slate-700 ${
    percentageValue > 100
      ? '[&>*]:bg-red-500'
      : percentageValue >= 90
        ? '[&>*]:bg-yellow-500'
        : '[&>*]:bg-green-500' // or bg-orange-500 for hours
  }`}
/>
```

Context-Specific Thresholds:

- **Budget Progress (Hours/Dollars)**: Caution ≥90%, Alert >100%
- **Billable Percentage**: Alert <60%, Caution <80%, Normal ≥80%
- **Non-Billable Percentage**: Normal <20%, Caution 20-40%, Alert >40%
- **Utilization Rates**: Caution ≥90%, Alert >100%

Required Implementation Areas:

1. **Budget Progress Bars**: Hours and dollar budget utilization
2. **Project Cards**: Budget utilization indicators
3. **Dashboard Summaries**: WBS and project totals
4. **Timesheet Components**: Billable/non-billable percentages
5. **KPI Indicators**: Performance metrics and thresholds

Styling Requirements:

- **Height**: Standard h-2 (8px) for compact display
- **Background**: `bg-slate-700` for track background
- **Border Radius**: Uses component default (typically rounded)
- **Responsive**: Maintains visibility at all screen sizes

DO NOT USE:

- Static colors without conditional formatting
- Different threshold logic across similar components
- Non-standard color schemes that don't follow base color rules
- Progress bars without clear caution/alert states

Customization Guidelines:

- Thresholds can be adjusted per context but must maintain yellow (caution) and red (alert) states
- Base colors should follow the established green (money) and orange (time/general) pattern
- New progress bar types should document their specific threshold logic
- Always provide clear visual progression: normal → caution → alert

All new progress bars must follow these standards to maintain consistent user experience and clear visual communication across the application.

Dark Theme Tooltips:
Visual Design:

- Background: Dark theme with high opacity: `bg-gray-900/90`
- Container: Rounded corners with padding: `rounded-lg px-3 py-2`
- Text: White text with small font size: `text-white text-xs`
- Positioning: Absolute positioning relative to parent element
- Z-index: High z-index for proper layering: `z-50`
- Shadow: Optional subtle shadow for depth
- Arrow: Small rotated square for pointer: `w-2 h-2 bg-gray-900/90 rotate-45`

Content Structure:

- Header: Optional bold section title: `font-semibold`
- Body: Content area with proper spacing: `mt-1 space-y-1`
- List Format: Vertical list with each item on separate line (not comma-separated)
- Line Height: Adequate spacing between list items
- Text Wrapping: `whitespace-nowrap` to prevent breaking on single-line content

Positioning & Layout:

- Standard Position: `absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2`
- Arrow Position: `absolute top-full left-1/2 transform -translate-x-1/2`
- Responsive: Consider edge cases and viewport boundaries
- Consistent Offset: 8px (mb-2) margin from trigger element

Behavior & Interaction:

- Trigger: Hover over parent element or designated hover area
- Transition: Quick fade-in with smooth animation: `transition-opacity duration-200`
- Timing: Immediate appearance on hover (no delay)
- Dismissal: Auto-hide on mouse leave
- Non-blocking: `pointer-events-none` to prevent interaction issues
- Accessibility: Consider ARIA labels and screen reader compatibility

State Management:

- React State: Use `useState` with boolean show/hide state
- Event Handlers: `onMouseEnter={() => setShowTooltip(true)}` and `onMouseLeave={() => setShowTooltip(false)}`
- Conditional Rendering: `{showTooltip && content && (<tooltip JSX>)}`
- Performance: Avoid creating tooltips for empty content

Technical Implementation:

- Framework: React with conditional rendering
- Styling: Tailwind CSS classes as specified above
- Container: Positioned relative parent for absolute tooltip positioning
- Animation: CSS transitions for smooth appearance/disappearance

Usage Examples:

- Budget information on project cards (HOURS and BILLED sections)
- Phase information on project timelines (PROJECT PHASES section)
- Additional context for any UI element requiring explanation
- Quick access to detailed information without navigating away

Standard Implementation Pattern:

```jsx
const [showTooltip, setShowTooltip] = useState(false);

<div
  className="relative"
  onMouseEnter={() => setShowTooltip(true)}
  onMouseLeave={() => setShowTooltip(false)}
>
  {/* Trigger element */}
  <div>Hover target content</div>

  {/* Tooltip */}
  {showTooltip && content && (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/90 text-white text-xs rounded-lg transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
      <div className="font-semibold">Section Title</div>
      <div className="mt-1 space-y-1">
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
    </div>
  )}
</div>;
```

Consistency Requirements:

- Use identical styling classes across all tooltips
- Maintain consistent positioning and arrow placement
- Apply same timing and transition effects
- Follow same content structure (header + list format)
- Use consistent z-index values for proper layering

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
