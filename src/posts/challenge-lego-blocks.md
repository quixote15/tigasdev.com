
## **Problem**

You have an infinite number of 4 types of lego blocks of sizes given as (depth x height x width):

d	h	w  
1	1	1  
1	1	2  
1	1	3  
1	1	4

Using these blocks, you want to make a wall of height  _n_  and width  _m_. Features of the wall are:

- The wall should not have any holes in it.  
- The wall you build should be one solid structure, so there should not be a straight vertical break across all rows of bricks.  
- The bricks must be laid horizontally.

How many ways can the wall be built?

**Example**

n = 2  
m = 3

The height is 2 and the width is 3. There are 9 valid permutations in all.

**Function Description**

Complete the legoBlocks function in the editor below.

legoBlocks has the following parameter(s):

-   int n: the height of the wall
-   int m: the width of the wall

**Returns**  
- int: the number of valid wall formations modulo (10⁹+7)

**Input Format**

The first line contains the number of test cases  _t_.

Each of the next  _t_  lines contains two space-separated integers  _n_  and  _m_.

**Constraints**

1 <= t <= 100  
1 <= n,m <= 1000

See HackerRack original question below:

[](https://www.hackerrank.com/challenges/lego-blocks/problem?source=post_page-----bca16e1dc065--------------------------------)

## Lego Blocks | HackerRank

### You have an infinite number of 4 types of lego blocks of sizes given as (depth x height x width): Using these blocks…

www.hackerrank.com

## Solution

There is a Python solution as follows:
```python
def legoBlocks(n, m):  
    MOD = (10**9 +7)  
    # Step 1: O(W)   
    # The number of combinations to build a single row  
    # As only four kinds of sizes, so  
    # base case:   
    # if width is 0, combination is 1  
    # if width is 1, combination is 1  
    # if width is 2, combination is 2  
    # if width is 3, combination is 4  
    row_combinations = [1, 1, 2, 4]  
      
    # Build row combinations up to current wall's width  
    while len(row_combinations) <= m:   
        row_combinations.append(sum(row_combinations[-4:]) % MOD)  
      
    # Step 2: O(W)  
    # Compute total combinations   
    # for constructing a wall of height N of varying widths  
    total = [pow(c, n, MOD) for c in row_combinations]  
      
    # Step 3: O(W^2)  
    # Find the number of unstable wall configurations   
    # for a wall of height N of varying widths  
    unstable = [0, 0]  
      
    # Divide the wall into left part and right part,  
    # and calculate the combination of left part and right part.  
    # From width is 2, we start to consider about violation.  
    for i in range(2, m + 1):  
        # i: current total width  
        # j: left width  
        # i - j: right width  
        # f: (left part - previous vertical violation)*right part  
        f = lambda j: (total[j] - unstable[j]) * total[i - j]  
        result = sum(map(f, range(1, i)))  
        unstable.append(result % MOD)  
      
    # Print the number of stable wall combinations  
    return (total[m] - unstable[m]) % MOD
```

It needs 3 steps to solve this problem:

1.  Consider all cases only one row
2.  Extend to all rows
3.  Subtract the vertically unstable cases

There are two ways to understand the above step 3. The unstable can be calculated by summing each (stable*total) (**solution 1**) or calculating the result immediately by summing each (result*total) (**solution 2**). Please see Java in detail to illustrate below. Please note “Solution 1” and “Solution 2” in the comments for two solutions.
```java
import java.io.*;  
import java.math.*;  
import java.security.*;  
import java.text.*;  
import java.util.*;  
import java.util.concurrent.*;  
import java.util.function.*;  
import java.util.regex.*;  
import java.util.stream.*;  
import static java.util.stream.Collectors.joining;  
import static java.util.stream.Collectors.toList;  
  
class Result {  
      
// - Step 1: consider only one row  
// - Step 2: extend to all rows  
// - Step 3: subtract the vertically unstable  
// The unstable is calculated by summing each stable*total  
// or calculate the result immediately by summing each result*total  
  
    /*  
     * Complete the 'legoBlocks' function below.  
     *  
     * The function is expected to return an INTEGER.  
     * The function accepts the following parameters:  
     *  1. INTEGER n - height  
     *  2. INTEGER m - width  
     */  
  
    public static int legoBlocks(int n, int m) {  
        // Write your code here  
        if (n < 2 || m < 1) return 0;  
        if (m == 1) return 1;  
          
        // - Step 1: consider only one row  
        long [] total = new long [m + 1];  
          
        // set a flag (-1) to calculate only once  
        for (int i = 0; i < total.length; i++)  
            total[i] = -1;  
          
        fillTot(total, m);  
          
        // - Step 2: extend to all rows  
        for (int i = 0; i < total.length; i++) {  
            long tmp = 1;  
            for (int j = 0; j < n; j++) {  
                tmp = (tmp * total[i]) % MOD;  
            }  
            total[i] = tmp;  
        }  
          
        // - Step 3: subtract the vertically unstable  
        // don't calculate the vertically unstable at first  
        long [] result = new long [m + 1];  
        // set a flag (-1) to calculate only once  
        for (int i = 0; i < result.length; i++)  
            result[i] = -1;  
          
        getResult(total, result, m);  
          
        // solution 1:  
        // - subtract the vertically unstable  
        // return (int) ((total[m] - result[m]) % MOD);  
          
        // solution 2:  
        // - return the result  
        return (int) (result[m] % MOD);  
    }  
      
    static long MOD = 1000000000 + 7;  
      
    // calculate unstable by splitting it into two parts and  
    // multiplying unstable part with total part  
    static long getResult(long [] total, long [] result, int i) {  
        if (result[i] == -1) {  
            if (i == 1) {  
                // solution 1  
                // result[i] = 0;  
                  
                // solution 2  
                result[i] = 1;  
            }  
            else {  
                // solution 1  
                // result[i] = 0;  
                // for (int j = 1; j < i; j++) {  
                //     result[i] += ((total[j] - getResult(total, result, j)) * total[i - j]) % MOD;  
                // }  
                  
                // solution 2   
                result[i] = total[i];  
                for (int j = 1; j < i; j++) {  
                    result[i] -= (getResult(total, result, j) * total[i - j]) % MOD;  
                }  
            }  
        }  
          
        return result[i];  
    }  
      
    // fill totals partially  
    static long fillTot(long [] total, int i) {  
        if (i < 0) return 0;  
          
        if (total[i] == -1) {  
            if (i == 0 || i == 1)   
                total[i] = 1;  
            else   
                total[i] = (fillTot(total, i - 1) + fillTot(total, i - 2) + fillTot(total, i - 3) + fillTot(total, i - 4)) % MOD;  
        }  
          
        return total[i];  
    }  
}  
  
public class Solution {  
    public static void main(String[] args) throws IOException {  
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));  
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));  
  
        int t = Integer.parseInt(bufferedReader.readLine().trim());  
  
        IntStream.range(0, t).forEach(tItr -> {  
            try {  
                String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");  
  
                int n = Integer.parseInt(firstMultipleInput[0]);  
  
                int m = Integer.parseInt(firstMultipleInput[1]);  
  
                int result = Result.legoBlocks(n, m);  
  
                bufferedWriter.write(String.valueOf(result));  
                bufferedWriter.newLine();  
            } catch (IOException ex) {  
                throw new RuntimeException(ex);  
            }  
        });  
  
        bufferedReader.close();  
        bufferedWriter.close();  
    }  
}
```

Happy coding!