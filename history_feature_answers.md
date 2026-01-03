### 1. Charting Library

**Recommendation:** `react-native-gifted-charts`
**Why?** It is highly customizable, supports smooth animations, and fits the "premium" aesthetic of Recurr. It handles bar charts (for comparisons) and line charts (for trends) exceptionally well. Since `react-native-svg` is already installed, this is a natural fit.

### 2. Firebase Data Structure

Subscriptions are currently stored in Firestore with the following relevant fields:

- `amount` & `currency`
- `billingCycle` (Weekly, Monthly, Yearly, etc.)
- `startDate` (timestamp)
- `category` (Streaming, AI, etc.)
- `status` (Active, Paused, Archived)

**Note:** Historical "transactions" are not currently stored as separate documents. The app uses a utility function `generatePaymentHistory` to calculate past and future payments algorithmically based on the subscription's start date and cycle.

### 3. Existing Components

Recurr uses a custom design system:

- **Styling:** Vanilla React Native `StyleSheet` with a centralized `ThemeContext`.
- **Icons:** `phosphor-react-native`.
- **Layout:** Custom components like `CategoryBadge`, `ServiceLogo`, and a standard `SafeAreaView` wrapper.
- **Library-free:** There is no reliance on heavy UI kits like React Native Paper or NativeBase, keeping the app lightweight and highly custom.

### 4. Chart Types Desired

- **Year-over-Year Comparison:** A grouped bar chart showing spending across different years or the current year vs. previous year.
- **Category Breakdown:** A horizontal bar chart or donut chart showing which categories consume most of the budget.
- **Spending Trend (Suggestion):** A line graph showing how monthly spending has evolved over the last 6-12 months.

### 5. Date Range Options

To provide the best user experience, we should support:

- **Last 6 Months** (Default)
- **Year to Date (YTD)**
- **Full Year (e.g., 2025)**
- **All Time**

### 6. Navigation

**Recommendation:** A dedicated **"Spending History"** or **"Detailed Analytics"** screen.

- Users can access this by tapping a "See History" or "View Detailed Report" button within the existing **Insights** tab.
- This keeps the Insights tab clean while allowing power users to deep-dive into charts.

### 7. Calculated vs Actual

**Current Approach:** Since we calculate history on the fly, the charts will show **Calculated History** (based on when subscriptions _should_ have been paid since their `startDate`).
**Future Idea:** Eventually, adding a "Mark as Paid" feature would allow for **Actual** spending tracking, but starting with **Calculated/Projected** spending is more useful for immediate visualization.

---

## Additional Questions for the Project Owner

1. **Budgeting:** Do you want to allow users to set a "Monthly Budget" that appears as a target line on the spending charts?
2. **Exporting:** Should users be able to export their spending history/data as a CSV or PDF?
3. **Interactive Tooltips:** When tapping a bar or point on the graph, should it show a breakdown of the subscriptions that made up that total?
